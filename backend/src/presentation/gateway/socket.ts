import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../socket/events';
import { NoteDTO } from '../../application/dtos/note-dto';

export class SocketGateway {
    constructor(private io: Server) { }

    broadcastPresence(users: any[]): void {
        this.io.emit(SOCKET_EVENTS.PRESENCE_USERS, { users });
    }

    sendBoardData(socket: Socket, data: any): void {
        socket.emit(SOCKET_EVENTS.BOARD_DATA, data);
    }

    broadcastNoteCreated(boardId: string, note: any): void {
        this.io.to(boardId).emit(SOCKET_EVENTS.NOTE_CREATED, note);
    }

    broadcastNoteUpdated(boardId: string, note: NoteDTO): void {
        this.io.to(boardId).emit(SOCKET_EVENTS.NOTE_UPDATED, note);
    }

    broadcastNoteDeleted(boardId: string, noteId: string): void {
        this.io.to(boardId).emit(SOCKET_EVENTS.NOTE_DELETED, { id: noteId });
    }

    broadcastNoteCommented(boardId: string, noteId: string, comment: any): void {
        this.io.to(boardId).emit(SOCKET_EVENTS.NOTE_COMMENTED, { noteId, comment });
    }

    sendError(socket: Socket, message: string): void {
        socket.emit(SOCKET_EVENTS.SERVER_ERROR, { message });
    }

    notifyBoardUsers(boardId: string, users: any[]): void {
        this.io.to(boardId).emit(SOCKET_EVENTS.BOARD_USERS, { boardId, users });
    }
}