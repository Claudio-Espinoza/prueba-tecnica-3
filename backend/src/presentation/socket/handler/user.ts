import { Socket } from 'socket.io';
import { SocketGateway } from '../../gateway/socket';
import { SOCKET_EVENTS } from '../events';
import { JoinUser } from '../../../application/usecases/join-user';
import { UserService } from '../../../application/services/user';

export function registerUserHandlers(
    socket: Socket,
    gateway: SocketGateway,
    joinUserUC: JoinUser,
    userService: UserService
) {
    socket.on(SOCKET_EVENTS.USER_JOIN, async (data: { name: string }) => {
        try {
            const user = await joinUserUC.execute({
                socketId: socket.id,
                name: data.name
            });

            const users = await userService.getAllUsers();

            socket.emit('user:joined', {
                socketId: socket.id,
                name: data.name,
                success: true
            });

            gateway.io.emit(SOCKET_EVENTS.PRESENCE_USERS, { users });
        } catch (error) {
            console.error('Error joining user:', error);
            socket.emit('user:join:error', { error: 'Failed to join' });
        }
    });
}

