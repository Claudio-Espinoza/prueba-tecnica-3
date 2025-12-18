import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { env } from './infrastructure/enviroment/env';
import { swaggerSpec, swaggerUiOptions } from './infrastructure/swagger/index';
import { logger } from './infrastructure/logger/index';
import { createBoardRoutes } from './presentation/routes/board';
import { createNoteRoutes } from './presentation/routes/note';
import { createCommentRoutes } from './presentation/routes/comment';
import { createUserRoutes } from './presentation/routes/user';
import { CreateBoard } from './application/usecases/create-board';
import { CreateNote } from './application/usecases/create-note';
import { UpdateNote } from './application/usecases/update-note';
import { DeleteNote } from './application/usecases/delete-note';
import { AddComment } from './application/usecases/add-comment';

let isConnectedToDatabase = false;

export function setDatabaseStatus(status: boolean) {
    isConnectedToDatabase = status;
}

export function createApp(
    createBoardUC: CreateBoard,
    createNoteUC: CreateNote,
    updateNoteUC: UpdateNote,
    deleteNoteUC: DeleteNote,
    addCommentUC: AddComment
): { app: Express; server: http.Server; io: Server } {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
    logger.info('SWAGGER', `📚 API Docs disponible en http://localhost:${env.port || 3001}/api-docs`);

    app.use((req, res, next) => {
        logger.info('HTTP', `${req.method} ${req.path}`, { ip: req.ip });
        next();
    });

    app.use('/api/boards', createBoardRoutes(createBoardUC));
    app.use('/api/notes', createNoteRoutes(createNoteUC, updateNoteUC, deleteNoteUC));
    app.use('/api/comments', createCommentRoutes(addCommentUC));
    app.use('/api/users', createUserRoutes());

    app.get('/health', (_, res) => {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        const healthStatus = {
            status: isConnectedToDatabase ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            server: {
                environment: env.nodeEnv,
                uptime: `${Math.floor(uptime)}s`,
                version: '1.0.0'
            },
            database: {
                connected: isConnectedToDatabase,
                type: 'SQLite',
                path: './data/collaboration.db'
            },
            memory: {
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
            },
            websocket: {
                enabled: true,
                transports: ['websocket', 'polling']
            }
        };

        const statusCode = isConnectedToDatabase ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    });

    app.get('/api/version', (_, res) => {
        res.json({
            version: '1.0.0',
            name: 'Prueba Técnica 3 Backend',
            uptime: `${Math.floor(process.uptime())}s`
        });
    });

    app.get('/api/status', (_, res) => {
        res.json({
            database: isConnectedToDatabase ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    });

    const server = http.createServer(app);

    const io = new Server(server, {
        cors: { origin: '*' },
        transports: ['websocket', 'polling']
    });

    return { app, server, io };
}