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

    socket.on(SOCKET_EVENTS.USER_UPDATE_ROLE, async (data: { boardId: string; userId: string; newRole: string }) => {
        try {
            const user = await userRepository.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            // Verificar que el usuario que solicita el cambio sea el creador del board
            // (Esta verificación se puede mejorar si hay un servicio que lo valide)
            console.log(`User ${user.getName()} requesting role change for ${data.userId} to ${data.newRole}`);

            // Emitir cambio de rol a todos en la sala
            io.to(data.boardId).emit(SOCKET_EVENTS.USER_ROLE_UPDATED, {
                boardId: data.boardId,
                userId: data.userId,
                role: data.newRole
            });

            console.log(`Role updated for user ${data.userId} to ${data.newRole} in board ${data.boardId}`);
        } catch (error) {
            console.error('Error updating user role:', error);
            socket.emit('user:role:error', { error: 'Failed to update role' });
        }
    });
}

