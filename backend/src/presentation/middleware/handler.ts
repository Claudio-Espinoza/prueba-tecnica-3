import { Socket, Server } from 'socket.io';
import { UserRepository } from '../../domain/repositories/user';
import { SocketGateway } from '../gateway/socket';
import { UserService } from '../../application/services/user';

export function handleDisconnect(
    socket: Socket,
    userRepo: UserRepository,
    gateway: SocketGateway,
    userService: UserService,
    io: Server
) {
    return async () => {
        try {
            await userRepo.deleteBySocketId(socket.id);

            // Obtener solo los usuarios con sockets conectados actualmente
            const connectedSocketIds = Array.from(io.sockets.sockets.keys());
            const connectedUsers = [];
            
            for (const socketId of connectedSocketIds) {
                const user = await userRepo.findBySocketId(socketId);
                if (user) {
                    connectedUsers.push({
                        socketId: user.getSocketId(),
                        name: user.getName(),
                        isOnline: true
                    });
                }
            }

            io.emit('presence:users', { users: connectedUsers });
            console.log(`User disconnected: ${socket.id}, remaining connected users: ${connectedUsers.length}`);
        } catch (err) {
            console.error('Disconnect error:', err);
        }
    };
}