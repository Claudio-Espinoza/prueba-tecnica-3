import { Router, Request, Response } from 'express';
import { CreateBoard } from '../../application/usecases/create-board';
import { logger } from '../../infrastructure/logger/index';
import {
    CreateBoardRequest,
    ApiResponse,
    PaginatedResponse,
    BoardDTO,
    ValidationErrorResponse
} from './config/types';
import { ValidationService } from './config/validations';

// Query Parameters Types
interface GetBoardsQuery {
    owner_id?: string;
    page?: string;
    limit?: string;
}

// Helper function to build error response
function buildErrorResponse(error: Error | string): ApiResponse<never> {
    const message = error instanceof Error ? error.message : String(error);
    return {
        success: false,
        error: message || 'Internal server error',
        timestamp: new Date().toISOString()
    };
}

// Helper function to build paginated error response
function buildPaginatedErrorResponse(
    error: Error | string,
    page: number = 1,
    limit: number = 10
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

export function createBoardRoutes(createBoardUC: CreateBoard): Router {
    const router = Router();

    /**
     * @swagger
     * /api/boards:
     *   post:
     *     summary: Crear un nuevo tablero
     *     tags: [Board]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 1
     *                 maxLength: 100
     *                 example: "Mi Tablero"
     *               description:
     *                 type: string
     *                 example: "Descripción del tablero"
     *               owner_id:
     *                 type: string
     *                 minLength: 1
     *                 maxLength: 100
     *                 example: "user123"
     *             required: [name, owner_id]
     *     responses:
     *       201:
     *         description: Tablero creado exitosamente
     *       400:
     *         description: Datos inválidos o validación fallida
     *       500:
     *         description: Error del servidor
     */
    router.post(
        '/',
        async (
            req: Request<object, object, CreateBoardRequest>,
            res: Response<ApiResponse<BoardDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                logger.debug('BOARD', 'POST /api/boards - Request received', { body: req.body });

                // Validar entrada
                const validationErrors = ValidationService.validateCreateBoard(req.body);
                if (validationErrors.length > 0) {
                    logger.warn('BOARD', 'Validation failed for create board', {
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

                const { name, description, owner_id } = req.body;

                const board = await createBoardUC.execute({
                    name,
                    description: description || '',
                    ownerId: owner_id
                });

                logger.info('BOARD', 'Board created successfully', {
                    board_id: board.getId(),
                    owner_id
                });

                res.status(201).json({
                    success: true,
                    data: board.toJSON(),
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('BOARD', 'Error creating board', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    /**
     * @swagger
     * /api/boards:
     *   get:
     *     summary: Listar todos los tableros
     *     tags: [Board]
     *     parameters:
     *       - in: query
     *         name: owner_id
     *         schema:
     *           type: string
     *         description: Filtrar por propietario
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Número de página (mínimo 1)
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Límite de resultados (máximo 100)
     *     responses:
     *       200:
     *         description: Lista de tableros obtenida exitosamente
     *       400:
     *         description: Parámetros de query inválidos
     *       500:
     *         description: Error del servidor
     */
    router.get(
        '/',
        async (
            req: Request<object, object, object, GetBoardsQuery>,
            res: Response<PaginatedResponse<BoardDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { owner_id, page, limit } = req.query;
                logger.debug('BOARD', 'GET /api/boards', { query: req.query });

                // Validar paginación
                const { page: pageNum, limit: limitNum, errors: paginationErrors } =
                    ValidationService.validatePagination(page, limit);

                if (paginationErrors.length > 0) {
                    logger.warn('BOARD', 'Invalid pagination parameters', {
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

                // TODO: Implementar con BoardRepository
                // const { boards, total } = await boardService.getAll({
                //   owner_id: owner_id,
                //   page: pageNum,
                //   limit: limitNum
                // });
                // if (boards.length === 0) {
                //   logger.info('BOARD', 'No boards found', { owner_id, page: pageNum });
                // }

                logger.info('BOARD', 'Boards retrieved', {
                    count: 0,
                    page: pageNum,
                    limit: limitNum,
                    owner_id
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
                logger.error('BOARD', 'Error getting boards', error as Error);
                res.status(500).json(buildPaginatedErrorResponse(error as Error, 1, 10));
            }
        }
    );

    /**
     * @swagger
     * /api/boards/{id}:
     *   get:
     *     summary: Obtener un tablero por ID
     *     tags: [Board]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del tablero
     *     responses:
     *       200:
     *         description: Tablero encontrado
     *       400:
     *         description: ID inválido o formato incorrecto
     *       404:
     *         description: Tablero no encontrado
     *       500:
     *         description: Error del servidor
     */
    router.get(
        '/:id',
        async (
            req: Request<{ id: string }>,
            res: Response<ApiResponse<BoardDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { id } = req.params;
                logger.debug('BOARD', `GET /api/boards/${id}`);

                // Validar UUID
                const uuidError = ValidationService.validateUUID(id, 'board_id');
                if (uuidError) {
                    logger.warn('BOARD', 'Invalid board ID format', { id });
                    res.status(400).json({
                        success: false,
                        error: uuidError.message,
                        errors: [uuidError],
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // TODO: Implementar con BoardRepository
                // const board = await boardService.getById(id);
                // if (!board) {
                //   logger.warn('BOARD', 'Board not found', { board_id: id });
                //   return res.status(404).json({
                //     success: false,
                //     error: 'Board not found',
                //     timestamp: new Date().toISOString()
                //   });
                // }

                logger.info('BOARD', 'Board retrieved', { board_id: id });

                res.status(200).json({
                    success: true,
                    data: undefined,
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('BOARD', 'Error getting board', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    /**
     * @swagger
     * /api/boards/{id}:
     *   delete:
     *     summary: Eliminar un tablero
     *     tags: [Board]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del tablero a eliminar
     *     responses:
     *       200:
     *         description: Tablero eliminado exitosamente
     *       400:
     *         description: ID inválido o formato incorrecto
     *       404:
     *         description: Tablero no encontrado
     *       500:
     *         description: Error del servidor
     */
    router.delete(
        '/:id',
        async (
            req: Request<{ id: string }>,
            res: Response<ApiResponse<{ message: string }> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { id } = req.params;
                logger.debug('BOARD', `DELETE /api/boards/${id}`);

                // Validar UUID
                const uuidError = ValidationService.validateUUID(id, 'board_id');
                if (uuidError) {
                    logger.warn('BOARD', 'Invalid board ID format', { id });
                    res.status(400).json({
                        success: false,
                        error: uuidError.message,
                        errors: [uuidError],
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // TODO: Implementar con BoardRepository
                // const board = await boardService.getById(id);
                // if (!board) {
                //   logger.warn('BOARD', 'Board not found for deletion', { board_id: id });
                //   return res.status(404).json({
                //     success: false,
                //     error: 'Board not found',
                //     timestamp: new Date().toISOString()
                //   });
                // }
                // await boardService.delete(id);

                logger.info('BOARD', 'Board deleted successfully', { board_id: id });

                res.status(200).json({
                    success: true,
                    data: { message: 'Board deleted successfully' },
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('BOARD', 'Error deleting board', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    return router;
}