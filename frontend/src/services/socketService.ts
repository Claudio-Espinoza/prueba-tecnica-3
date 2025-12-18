import { io, Socket } from 'socket.io-client';

export interface User {
    socketId: string;
    name: string;
    isOnline: boolean;
}

export interface PresenceData {
    users: User[];
}

export interface UserJoinedData {
    socketId: string;
    name: string;
    success: boolean;
}

class SocketService {
    public socket: Socket | null = null;

    connect(serverUrl: string = 'http://localhost:3001'): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(serverUrl, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 5
                });

                this.socket.on('connect', () => {
                    console.log('✅ Socket connected:', this.socket?.id);
                    resolve();
                });

                this.socket.on('disconnect', () => {
                    console.log('👋 Socket disconnected');
                });

                this.socket.on('error', (error) => {
                    console.error('❌ Socket error:', error);
                    reject(error);
                });

                this.socket.on('connect_error', (error) => {
                    console.error('❌ Connection error:', error);
                    reject(error);
                });
            } catch (error) {
                console.error('Failed to connect:', error);
                reject(error);
            }
        });
    }

    /**
     * Desconectar del servidor
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinWithName(name: string): void {
        if (!this.socket) {
            console.error('Socket no conectado');
            return;
        }

        if (!name || name.trim() === '') {
            console.error('Nombre vacío');
            return;
        }

        console.log(`📍 Joining as: ${name}`);
        this.socket.emit('user:join', { name: name.trim() });
    }

    onUserJoined(callback: (data: UserJoinedData) => void): void {
        if (this.socket) {
            this.socket.on('user:joined', callback);
        }
    }

    /**
     * Escuchar lista de usuarios presentes
     */
    onPresenceUsers(callback: (data: PresenceData) => void): void {
        if (this.socket) {
            this.socket.on('presence:users', callback);
        }
    }

    requestPresenceList(): void {
        if (this.socket) {
            this.socket.emit('presence:list');
        }
    }

    createBoard(name: string, description: string = ''): void {
        if (!this.socket) {
            console.error('Socket no conectado');
            return;
        }

        if (!name || name.trim() === '') {
            console.error('Nombre de tablero vacío');
            return;
        }

        console.log(`📋 Creating board: ${name}`);
        this.socket.emit('board:create', {
            name: name.trim(),
            description: description.trim()
        });
    }

    joinBoard(boardId: string): void {
        if (!this.socket) {
            console.error('Socket no conectado');
            return;
        }

        console.log(`🚪 Joining board: ${boardId}`);
        this.socket.emit('board:join', { boardId });
    }

    requestBoardList(): void {
        if (this.socket) {
            this.socket.emit('board:list');
        }
    }

    onBoardCreated(callback: (board: any) => void): void {
        if (this.socket) {
            this.socket.on('board:created', callback);
        }
    }

    onBoardList(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('board:list', callback);
        }
    }

    onBoardJoined(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('board:joined', callback);
        }
    }

    onBoardData(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('board:data', callback);
        }
    }

    onBoardUserJoined(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('board:user-joined', callback);
        }
    }

    onBoardUserLeft(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('board:user-left', callback);
        }
    }

    onBoardUsersUpdated(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('board:users-updated', callback);
        }
    }

    leaveBoard(boardId: string): void {
        if (!this.socket) {
            console.error('Socket no conectado');
            return;
        }

        console.log(`👋 Leaving board: ${boardId}`);
        this.socket.emit('board:leave', { boardId });
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    getSocketId(): string | undefined {
        return this.socket?.id;
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketService();
