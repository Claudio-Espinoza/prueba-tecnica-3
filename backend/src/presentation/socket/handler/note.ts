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
    // Escuchar eventos del frontend: notes:create, notes:update, etc.
    socket.on(
        SOCKET_EVENTS.NOTE_CREATE,
        async (data: { boardId: string; title?: string; description?: string; x?: number; y?: number; width?: number; height?: number; color?: string }) => {
            try {
                const user = await userRepo.findBySocketId(socket.id);
                if (!user) throw new Error('User not found');

                // Usar los datos tal como vienen del frontend (sin validación strict de role por ahora)
                const noteData = {
                    boardId: data.boardId,
                    title: data.title || 'Sin título',
                    content: data.description || '',
                    x: data.x || 50,
                    y: data.y || 50,
                    width: data.width || 200,
                    height: data.height || 150,
                    color: data.color || '#FF6B6B',
                    user
                };

                console.log(`📝 Crear nota en board ${data.boardId}:`, noteData);

                // TODO: Guardar en BD si está disponible
                // const note = await createNoteUC.execute(noteData);

                // Por ahora, usar los datos directamente
                const enrichedNote = {
                    ...noteData,
                    id: Date.now().toString(),
                    createdBy: user.getId?.().value || socket.id,
                    createdByName: user.getName?.() || 'Unknown',
                    comments: [],
                    createdAt: new Date().toISOString(),
                };

                // Broadcast a todos en el board
                const io = (socket as any).nsp.server;
                io.to(data.boardId).emit(SOCKET_EVENTS.NOTE_CREATED, {
                    boardId: data.boardId,
                    note: enrichedNote,
                    userId: socket.id,
                });

                console.log(`✅ Nota creada: ${enrichedNote.id}`);
            } catch (err: any) {
                console.error('❌ Error creating note:', err);
                gateway.sendError(socket, err.message);
            }
        }
    );

    // Escuchar actualización de posición (drag-drop)
    socket.on(
        SOCKET_EVENTS.NOTE_UPDATE_POSITION,
        async (data: {
            boardId: string;
            noteId: string;
            x: number;
            y: number;
        }) => {
            try {
                console.log(`📍 Actualizando posición de nota ${data.noteId} a (${data.x}, ${data.y})`);

                // TODO: Guardar posición en BD si está disponible
                // await updateNoteUC.execute({...});

                // Broadcast a todos en el board (excepto al que envió)
                const io = (socket as any).nsp.server;
                io.to(data.boardId).emit(SOCKET_EVENTS.NOTE_POSITION_UPDATED, {
                    boardId: data.boardId,
                    noteId: data.noteId,
                    x: data.x,
                    y: data.y,
                    userId: socket.id,
                });

                console.log(`✅ Posición actualizada: ${data.noteId}`);
            } catch (err: any) {
                console.error('❌ Error updating position:', err);
                gateway.sendError(socket, err.message);
            }
        }
    );

    // Escuchar actualización completa de nota
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

                // TODO: Guardar en BD si está disponible
                // await updateNoteUC.execute({...});

                // Broadcast a todos
                const io = (socket as any).nsp.server;
                io.to(data.boardId).emit(SOCKET_EVENTS.NOTE_UPDATED, {
                    boardId: data.boardId,
                    noteId: data.id,
                    updates: {
                        title: data.title,
                        content: data.content,
                        x: data.x,
                        y: data.y
                    }
                });

                console.log(`✅ Nota actualizada: ${data.id}`);
            } catch (err: any) {
                console.error('❌ Error updating note:', err);
                gateway.sendError(socket, err.message);
            }
        }
    );

    socket.on(SOCKET_EVENTS.NOTE_DELETE, async (data: { boardId: string; noteId: string }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            console.log(`🗑️ Eliminando nota ${data.noteId} del board ${data.boardId}`);

            // TODO: Eliminar de BD si está disponible
            // await deleteNoteUC.execute(data.boardId, data.noteId, user);

            // Broadcast a todos en el board
            const io = (socket as any).nsp.server;
            io.to(data.boardId).emit(SOCKET_EVENTS.NOTE_DELETED, {
                boardId: data.boardId,
                noteId: data.noteId,
                userId: socket.id,
            });

            console.log(`✅ Nota eliminada: ${data.noteId}`);
        } catch (err: any) {
            console.error('❌ Error deleting note:', err);
            gateway.sendError(socket, err.message);
        }
    });

    // Escuchar agregar comentario
    socket.on(SOCKET_EVENTS.NOTE_COMMENT, async (data: { boardId: string; noteId: string; comment: any }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            console.log(`💬 Agregando comentario a nota ${data.noteId}`);

            // Enriquecer el comentario con información del usuario
            const enrichedComment = {
                ...data.comment,
                userId: user.getId?.().value || socket.id,
                userName: user.getName?.() || 'Unknown',
                createdAt: new Date().toISOString(),
            };

            // TODO: Guardar comentario en BD si está disponible
            // const comment = await addCommentUC.execute({...});

            // Broadcast a todos en el board
            const io = (socket as any).nsp.server;
            io.to(data.boardId).emit(SOCKET_EVENTS.NOTE_COMMENTED, {
                boardId: data.boardId,
                noteId: data.noteId,
                comment: enrichedComment,
                userId: socket.id,
            });

            console.log(`✅ Comentario agregado: ${data.noteId}`);
        } catch (err: any) {
            console.error('❌ Error adding comment:', err);
            gateway.sendError(socket, err.message);
        }
    });
}