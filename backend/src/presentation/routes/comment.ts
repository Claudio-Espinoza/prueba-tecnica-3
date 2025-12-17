import { Router, Request, Response } from 'express';
import { AddComment } from '../../application/usecases/add-comment';
import { logger } from '../../infrastructure/logger/index';
import {
    CreateCommentRequest,
    ApiResponse,
    PaginatedResponse,
    CommentDTO,
    ValidationErrorResponse
} from './config/types';
import { ValidationService } from './config/validations';

// Query Parameters Types
interface GetCommentsQuery {
    page?: string;
    limit?: string;
}

// Helper functions
function buildErrorResponse(error: Error | string): ApiResponse<never> {
    const message = error instanceof Error ? error.message : String(error);
    return {
        success: false,
        error: message || 'Internal server error',
        timestamp: new Date().toISOString()
    };
}

function buildPaginatedErrorResponse(
    error: Error | string,
    page: number = 1,
    limit: number = 20
): PaginatedResponse<never> {
    const message = error instanceof Error ? error.message : String(error);
    return {
        success: false,
        data: [],
        error: message || 'Internal server error',
        total: 0,
        page,
        limit,
        timestamp: new Date().toISOString()
    };
}

export function createCommentRoutes(addCommentUC: AddComment): Router {
    const router = Router();

    /**
     * @swagger
     * /api/comments:
     *   post:
     *     summary: Agregar comentario a una nota
     *     tags: [Comment]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               board_id:
     *                 type: string
     *                 format: uuid
     *               note_id:
     *                 type: string
     *                 format: uuid
     *               text:
     *                 type: string
     *               user_name:
     *                 type: string
     *             required: [note_id, text, user_name]
     *     responses:
     *       201:
     *         description: Comentario creado
     *       400:
     *         description: Datos inválidos
     */
    router.post(
        '/',
        async (
            req: Request<object, object, CreateCommentRequest>,
            res: Response<ApiResponse<CommentDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                logger.debug('COMMENT', 'POST /api/comments - Request received', { body: req.body });

                const validationErrors = ValidationService.validateCreateComment(req.body);
                if (validationErrors.length > 0) {
                    logger.warn('COMMENT', 'Validation failed for create comment', {
                        errors: validationErrors
                    });
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        errors: validationErrors,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const { board_id, note_id, text, user_name } = req.body;

                // TODO: Fix - need to get user from authentication context
                const comment = await addCommentUC.execute({
                    boardId: board_id || '',
                    noteId: note_id,
                    text,
                    user: { name: String(user_name || '') } as any // Placeholder - will be fixed with auth integration
                });

                logger.info('COMMENT', 'Comment created successfully', {
                    comment_id: comment.getId(),
                    note_id
                });

                res.status(201).json({
                    success: true,
                    data: comment.toJSON(),
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('COMMENT', 'Error creating comment', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    /**
     * @swagger
     * /api/comments/{noteId}:
     *   get:
     *     summary: Listar comentarios de una nota
     *     tags: [Comment]
     *     parameters:
     *       - in: path
     *         name: noteId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *     responses:
     *       200:
     *         description: Lista de comentarios
     *       400:
     *         description: Parámetros inválidos
     *       404:
     *         description: Nota no encontrada
     */
    router.get(
        '/:noteId',
        async (
            req: Request<{ noteId: string }, object, object, GetCommentsQuery>,
            res: Response<PaginatedResponse<CommentDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { noteId } = req.params;
                const { page, limit } = req.query;

                logger.debug('COMMENT', `GET /api/comments/${noteId}`, { query: req.query });

                const noteIdError = ValidationService.validateUUID(noteId, 'note_id');
                if (noteIdError) {
                    logger.warn('COMMENT', 'Invalid note ID format', { noteId });
                    res.status(400).json({
                        success: false,
                        data: [],
                        error: noteIdError.message,
                        errors: [noteIdError],
                        total: 0,
                        page: 1,
                        limit: 20,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const { page: pageNum, limit: limitNum, errors: paginationErrors } =
                    ValidationService.validatePagination(page, limit);

                if (paginationErrors.length > 0) {
                    logger.warn('COMMENT', 'Invalid pagination parameters', {
                        errors: paginationErrors
                    });
                    res.status(400).json({
                        success: false,
                        data: [],
                        error: 'Invalid pagination parameters',
                        errors: paginationErrors,
                        total: 0,
                        page: pageNum,
                        limit: limitNum,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // TODO: Implementar con CommentRepository
                // const { comments, total } = await commentService.getByNoteId(noteId, pageNum, limitNum);

                logger.info('COMMENT', 'Comments retrieved', {
                    noteId,
                    count: 0,
                    page: pageNum
                });

                res.status(200).json({
                    success: true,
                    data: [],
                    total: 0,
                    page: pageNum,
                    limit: limitNum,
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('COMMENT', 'Error getting comments', error as Error);
                res.status(500).json(buildPaginatedErrorResponse(error as Error, 1, 20));
            }
        }
    );

    return router;
}