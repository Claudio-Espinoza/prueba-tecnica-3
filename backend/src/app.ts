import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { env } from './infrastructure/enviroment/env';

let isConnectedToDatabase = false;

export function setDatabaseStatus(status: boolean) {
    isConnectedToDatabase = status;
}

export function createApp(): { app: Express; server: http.Server; io: Server } {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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
                url: env.supabaseUrl ? 'Configured' : 'Missing',
                credentialsSet: !!env.supabaseServiceRoleKey
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