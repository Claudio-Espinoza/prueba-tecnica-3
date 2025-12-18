import { Socket, Server } from 'socket.io';
import { SocketGateway } from '../../gateway/socket';
import { SOCKET_EVENTS } from '../events';
import { JoinUser } from '../../../application/usecases/join-user';
import { UserService } from '../../../application/services/user';
import { UserRepository } from '../../../domain/repositories/user';

export function registerUserHandlers(
    socket: Socket,
    gateway: SocketGateway,
    joinUserUC: JoinUser,
    userService: UserService,
    userRepository: UserRepository,
    io: Server
) {
    socket.on(SOCKET_EVENTS.USER_JOIN, async (data: { name: string }) => {
        try {
            const user = await joinUserUC.execute({
                socketId: socket.id,
                name: data.name
            });

            socket.emit('user:joined', {
                socketId: socket.id,
                name: data.name,
                success: true
            });

            // Obtener solo los usuarios con sockets conectados actualmente
            const connectedSocketIds = Array.from(io.sockets.sockets.keys());
            const connectedUsers = [];

            for (const socketId of connectedSocketIds) {
                const user = await userRepository.findBySocketId(socketId);
                if (user) {
                    connectedUsers.push({
                        socketId: user.getSocketId(),
                        name: user.getName(),
                        isOnline: true
                    });
                }
            }

            io.emit(SOCKET_EVENTS.PRESENCE_USERS, { users: connectedUsers });
            console.log(`User joined: ${data.name}, connected users: ${connectedUsers.length}`);
        } catch (error) {
            console.error('Error joining user:', error);
            socket.emit('user:join:error', { error: 'Failed to join' });
        }
    });
}

