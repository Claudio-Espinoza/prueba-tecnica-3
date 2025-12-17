import { Socket } from 'socket.io';
import { SocketGateway } from '../../gateway/socket';
import { SOCKET_EVENTS } from '../events';
import { AddComment } from '../../../application/usecases/add-comment';
import { UserRepository } from '../../../domain/repositories/user';
import { requireBoardAccess } from '../../middleware/auth';

export function registerCommentHandlers(
    socket: Socket,
    gateway: SocketGateway,
    addCommentUC: AddComment,
    userRepo: UserRepository
) {
    socket.on(
        SOCKET_EVENTS.NOTE_COMMENT,
        async (data: { boardId: string; noteId: string; text: string }) => {
            try {
                const user = await userRepo.findBySocketId(socket.id);
                if (!user) throw new Error('User not found');

                requireBoardAccess(user, data.boardId);

                const comment = await addCommentUC.execute({
                    boardId: data.boardId,
                    noteId: data.noteId,
                    text: data.text,
                    user
                });

                gateway.broadcastNoteCommented(data.boardId, data.noteId, comment.toJSON());
                console.log(`Comment added: ${comment.getId()}`);
            } catch (err: any) {
                gateway.sendError(socket, err.message);
            }
        }
    );
}