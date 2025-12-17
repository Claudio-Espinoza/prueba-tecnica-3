import { Router, Request, Response } from 'express';
import { CreateNote } from '../../application/usecases/create-note';
import { UpdateNote } from '../../application/usecases/update-note';
import { DeleteNote } from '../../application/usecases/delete-note';
import { logger } from '../../infrastructure/logger/index';
import {
    CreateNoteRequest,
    UpdateNoteRequest,
    ApiResponse,
    PaginatedResponse,
    NoteDTO,
    ValidationErrorResponse
} from './config/types';
import { ValidationService } from './config/validations';

// Query Parameters Types
interface GetNotesQuery {
    board_id?: string;
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
    limit: number = 50
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

export function createNoteRoutes(
    createNoteUC: CreateNote,
    updateNoteUC: UpdateNote,
    deleteNoteUC: DeleteNote
): Router {
    const router = Router();

    /**
     * @swagger
     * /api/notes:
     *   post:
     *     summary: Crear una nueva nota
     *     tags: [Note]
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
     *               title:
     *                 type: string
     *               content:
     *                 type: string
     *               x:
     *                 type: integer
     *               y:
     *                 type: integer
     *               updated_by:
     *                 type: string
     *             required: [board_id, title, x, y, updated_by]
     *     responses:
     *       201:
     *         description: Nota creada
     *       400:
     *         description: Datos inválidos
     */
    router.post(
        '/',
        async (
            req: Request<object, object, CreateNoteRequest>,
            res: Response<ApiResponse<NoteDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                logger.debug('NOTE', 'POST /api/notes - Request received', { body: req.body });

                const validationErrors = ValidationService.validateCreateNote(req.body);
                if (validationErrors.length > 0) {
                    logger.warn('NOTE', 'Validation failed for create note', {
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

                const { board_id, title, content, x, y, updated_by } = req.body;

                // TODO: Fix - need to get user from authentication context
                const note = await createNoteUC.execute({
                    boardId: board_id,
                    title,
                    content: content || '',
                    x,
                    y,
                    user: null as any // Placeholder - will be fixed with auth integration
                });

                logger.info('NOTE', 'Note created successfully', {
                    note_id: note.getId(),
                    board_id
                });

                res.status(201).json({
                    success: true,
                    data: note.toJSON(),
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('NOTE', 'Error creating note', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    /**
     * @swagger
     * /api/notes:
     *   get:
     *     summary: Listar notas por tablero
     *     tags: [Note]
     *     parameters:
     *       - in: query
     *         name: board_id
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
     *           default: 50
     *     responses:
     *       200:
     *         description: Lista de notas
     *       400:
     *         description: Parámetros inválidos
     */
    router.get(
        '/',
        async (
            req: Request<object, object, object, GetNotesQuery>,
            res: Response<PaginatedResponse<NoteDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { board_id, page, limit } = req.query;
                logger.debug('NOTE', 'GET /api/notes', { query: req.query });

                if (!board_id) {
                    logger.warn('NOTE', 'Missing board_id parameter');
                    res.status(400).json({
                        success: false,
                        data: [],
                        error: 'board_id is required',
                        errors: [{ field: 'board_id', message: 'board_id is required' }],
                        total: 0,
                        page: 1,
                        limit: 50,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const boardIdError = ValidationService.validateUUID(board_id, 'board_id');
                if (boardIdError) {
                    logger.warn('NOTE', 'Invalid board_id format', { board_id });
                    res.status(400).json({
                        success: false,
                        data: [],
                        error: boardIdError.message,
                        errors: [boardIdError],
                        total: 0,
                        page: 1,
                        limit: 50,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const { page: pageNum, limit: limitNum, errors: paginationErrors } =
                    ValidationService.validatePagination(page, limit);

                if (paginationErrors.length > 0) {
                    logger.warn('NOTE', 'Invalid pagination parameters', {
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

                // TODO: Implementar con NoteRepository
                // const { notes, total } = await noteService.getByBoardId(board_id, pageNum, limitNum);

                logger.info('NOTE', 'Notes retrieved', {
                    board_id,
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
                logger.error('NOTE', 'Error getting notes', error as Error);
                res.status(500).json(buildPaginatedErrorResponse(error as Error, 1, 50));
            }
        }
    );

    /**
     * @swagger
     * /api/notes/{id}:
     *   get:
     *     summary: Obtener una nota por ID
     *     tags: [Note]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Nota encontrada
     *       400:
     *         description: ID inválido
     *       404:
     *         description: Nota no encontrada
     */
    router.get(
        '/:id',
        async (
            req: Request<{ id: string }>,
            res: Response<ApiResponse<NoteDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { id } = req.params;
                logger.debug('NOTE', `GET /api/notes/${id}`);

                const uuidError = ValidationService.validateUUID(id, 'note_id');
                if (uuidError) {
                    logger.warn('NOTE', 'Invalid note ID format', { id });
                    res.status(400).json({
                        success: false,
                        error: uuidError.message,
                        errors: [uuidError],
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // TODO: Implementar con NoteRepository
                // const note = await noteService.getById(id);
                // if (!note) {
                //   logger.warn('NOTE', 'Note not found', { note_id: id });
                //   return res.status(404).json({...});
                // }

                logger.info('NOTE', 'Note retrieved', { note_id: id });

                res.status(200).json({
                    success: true,
                    data: undefined,
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('NOTE', 'Error getting note', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    /**
     * @swagger
     * /api/notes/{id}:
     *   put:
     *     summary: Actualizar una nota
     *     tags: [Note]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               content:
     *                 type: string
     *               x:
     *                 type: integer
     *               y:
     *                 type: integer
     *               updated_by:
     *                 type: string
     *             required: [updated_by]
     *     responses:
     *       200:
     *         description: Nota actualizada
     *       400:
     *         description: Datos inválidos
     */
    router.put(
        '/:id',
        async (
            req: Request<{ id: string }, object, UpdateNoteRequest>,
            res: Response<ApiResponse<NoteDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { id } = req.params;
                logger.debug('NOTE', `PUT /api/notes/${id}`, { body: req.body });

                const uuidError = ValidationService.validateUUID(id, 'note_id');
                if (uuidError) {
                    logger.warn('NOTE', 'Invalid note ID format', { id });
                    res.status(400).json({
                        success: false,
                        error: uuidError.message,
                        errors: [uuidError],
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const validationErrors = ValidationService.validateUpdateNote(req.body);
                if (validationErrors.length > 0) {
                    logger.warn('NOTE', 'Validation failed for update note', {
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

                const { title, content, x, y, updated_by } = req.body;

                // TODO: Fix - need to get user from authentication context
                const note = await updateNoteUC.execute({
                    boardId: '', // Will be provided by auth
                    noteId: id,
                    title,
                    content,
                    x,
                    y,
                    user: null as any // Placeholder - will be fixed with auth integration
                });

                logger.info('NOTE', 'Note updated successfully', { note_id: id });

                res.status(200).json({
                    success: true,
                    data: undefined,
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('NOTE', 'Error updating note', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    /**
     * @swagger
     * /api/notes/{id}:
     *   delete:
     *     summary: Eliminar una nota
     *     tags: [Note]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Nota eliminada
     *       400:
     *         description: ID inválido
     *       404:
     *         description: Nota no encontrada
     */
    router.delete(
        '/:id',
        async (
            req: Request<{ id: string }>,
            res: Response<ApiResponse<{ message: string }> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { id } = req.params;
                logger.debug('NOTE', `DELETE /api/notes/${id}`);

                const uuidError = ValidationService.validateUUID(id, 'note_id');
                if (uuidError) {
                    logger.warn('NOTE', 'Invalid note ID format', { id });
                    res.status(400).json({
                        success: false,
                        error: uuidError.message,
                        errors: [uuidError],
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // TODO: Fix - need to get user and boardId from authentication context
                await deleteNoteUC.execute('', id, null as any);

                logger.info('NOTE', 'Note deleted successfully', { note_id: id });

                res.status(200).json({
                    success: true,
                    data: { message: 'Note deleted successfully' },
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('NOTE', 'Error deleting note', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    return router;
}