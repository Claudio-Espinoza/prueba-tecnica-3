import { Socket } from 'socket.io';
import { SocketGateway } from '../../gateway/socket';
import { SOCKET_EVENTS } from '../events';
import { CreateNote } from '../../../application/usecases/create-note';
import { UpdateNote } from '../../../application/usecases/update-note';
import { DeleteNote } from '../../../application/usecases/delete-note';
import { NoteService } from '../../../application/services/note';
import { UserRepository } from '../../../domain/repositories/user';
import { requireEditor } from '../../middleware/auth';

export function registerNoteHandlers(
    socket: Socket,
    gateway: SocketGateway,
    createNoteUC: CreateNote,
    updateNoteUC: UpdateNote,
    deleteNoteUC: DeleteNote,
    noteService: NoteService,
    userRepo: UserRepository
) {
    socket.on(
        SOCKET_EVENTS.NOTE_CREATE,
        async (data: { boardId: string; title: string; content?: string; x: number; y: number }) => {
            try {
                const user = await userRepo.findBySocketId(socket.id);
                if (!user) throw new Error('User not found');

                requireEditor(user, data.boardId);

                const note = await createNoteUC.execute({
                    boardId: data.boardId,
                    title: data.title,
                    content: data.content,
                    x: data.x,
                    y: data.y,
                    user
                });

                gateway.broadcastNoteCreated(data.boardId, note.toJSON() as any);
                console.log(`Note created: ${note.getId().value}`);
            } catch (err: any) {
                gateway.sendError(socket, err.message);
            }
        }
    );

    socket.on(
        SOCKET_EVENTS.NOTE_UPDATE,
        async (data: {
            boardId: string;
            id: string;
            title?: string;
            content?: string;
            x?: number;
            y?: number;
        }) => {
            try {
                const user = await userRepo.findBySocketId(socket.id);
                if (!user) throw new Error('User not found');

                requireEditor(user, data.boardId);

                await updateNoteUC.execute({
                    boardId: data.boardId,
                    noteId: data.id,
                    title: data.title,
                    content: data.content,
                    x: data.x,
                    y: data.y,
                    user
                });

                const notes = await noteService.getNotesByBoard(data.boardId);
                const updated = notes.find(n => n.id === data.id);

                if (updated) {
                    gateway.broadcastNoteUpdated(data.boardId, updated);
                }

                console.log(`Note updated: ${data.id}`);
            } catch (err: any) {
                gateway.sendError(socket, err.message);
            }
        }
    );

    socket.on(SOCKET_EVENTS.NOTE_DELETE, async (data: { boardId: string; id: string }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            requireEditor(user, data.boardId);

            await deleteNoteUC.execute(data.boardId, data.id, user);
            gateway.broadcastNoteDeleted(data.boardId, data.id);

            console.log(`Note deleted: ${data.id}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });
}