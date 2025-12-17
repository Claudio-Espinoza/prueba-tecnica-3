import { Socket } from 'socket.io';
import { UserRepository } from '../../domain/repositories/user';
import { SocketGateway } from '../gateway/socket';
import { UserService } from '../../application/services/user';

export function handleDisconnect(
    socket: Socket,
    userRepo: UserRepository,
    gateway: SocketGateway,
    userService: UserService
) {
    return async () => {
        try {
            await userRepo.deleteBySocketId(socket.id);
            const users = await userService.getAllUsers();
            gateway.broadcastPresence(users);
            console.log(`User disconnected: ${socket.id}`);
        } catch (err) {
            console.error('Disconnect error:', err);
        }
    };
}