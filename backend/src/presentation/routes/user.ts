import { Router, Request, Response } from 'express';
import { logger } from '../../infrastructure/logger/index';
import {
    ApiResponse,
    PaginatedResponse,
    UserDTO,
    ValidationErrorResponse
} from './config/types';
import { ValidationService } from './config/validations';

// Query Parameters Types
interface GetUsersQuery {
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

export function createUserRoutes(): Router {
    const router = Router();

    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Listar usuarios conectados
     *     tags: [User]
     *     parameters:
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
     *         description: Lista de usuarios conectados
     *       400:
     *         description: Parámetros inválidos
     */
    router.get(
        '/',
        async (
            req: Request<object, object, object, GetUsersQuery>,
            res: Response<PaginatedResponse<UserDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { page, limit } = req.query;
                logger.debug('USER', 'GET /api/users', { query: req.query });

                const { page: pageNum, limit: limitNum, errors: paginationErrors } =
                    ValidationService.validatePagination(page, limit);

                if (paginationErrors.length > 0) {
                    logger.warn('USER', 'Invalid pagination parameters', {
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

                // TODO: Implementar con UserRepository
                // const { users, total } = await userService.getConnected(pageNum, limitNum);

                logger.info('USER', 'Users retrieved', {
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
                logger.error('USER', 'Error getting users', error as Error);
                res.status(500).json(buildPaginatedErrorResponse(error as Error, 1, 20));
            }
        }
    );

    /**
     * @swagger
     * /api/users/{id}:
     *   get:
     *     summary: Obtener un usuario por ID
     *     tags: [User]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Usuario encontrado
     *       400:
     *         description: ID inválido
     *       404:
     *         description: Usuario no encontrado
     */
    router.get(
        '/:id',
        async (
            req: Request<{ id: string }>,
            res: Response<ApiResponse<UserDTO> | ValidationErrorResponse>
        ): Promise<void> => {
            try {
                const { id } = req.params;
                logger.debug('USER', `GET /api/users/${id}`);

                const uuidError = ValidationService.validateUUID(id, 'user_id');
                if (uuidError) {
                    logger.warn('USER', 'Invalid user ID format', { id });
                    res.status(400).json({
                        success: false,
                        error: uuidError.message,
                        errors: [uuidError],
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // TODO: Implementar con UserRepository
                // const user = await userService.getById(id);
                // if (!user) {
                //   logger.warn('USER', 'User not found', { user_id: id });
                //   return res.status(404).json(buildErrorResponse(new Error('User not found'), 404));
                // }

                logger.info('USER', 'User retrieved', { user_id: id });

                res.status(200).json({
                    success: true,
                    data: undefined,
                    timestamp: new Date().toISOString()
                });
            } catch (error: unknown) {
                logger.error('USER', 'Error getting user', error as Error);
                res.status(500).json(buildErrorResponse(error as Error));
            }
        }
    );

    return router;
}