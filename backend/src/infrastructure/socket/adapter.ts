import { Server } from 'socket.io';
import { SocketGateway } from '../../presentation/gateway/socket';
import { registerBoardHandlers } from '../../presentation/socket/handler/board';
import { registerNoteHandlers } from '../../presentation/socket/handler/note';
import { registerCommentHandlers } from '../../presentation/socket/handler/comment';
import { registerUserHandlers } from '../../presentation/socket/handler/user';
import { handleDisconnect } from '../../presentation/middleware/handler';
import { CreateBoard } from '../../application/usecases/create-board';
import { JoinBoard } from '../../application/usecases/join-board';
import { CreateNote } from '../../application/usecases/create-note';
import { UpdateNote } from '../../application/usecases/update-note';
import { DeleteNote } from '../../application/usecases/delete-note';
import { AddComment } from '../../application/usecases/add-comment';
import { JoinUser } from '../../application/usecases/join-user';
import { BoardService } from '../../application/services/board';
import { NoteService } from '../../application/services/note';
import { UserService } from '../../application/services/user';
import { UserRepository } from '../../domain/repositories/user';

export class SocketAdapter {
    constructor(
        private io: Server,
        private boardService: BoardService,
        private noteService: NoteService,
        private userService: UserService,
        private userRepo: UserRepository,
        private createBoardUC: CreateBoard,
        private joinBoardUC: JoinBoard,
        private createNoteUC: CreateNote,
        private updateNoteUC: UpdateNote,
        private deleteNoteUC: DeleteNote,
        private addCommentUC: AddComment,
        private joinUserUC: JoinUser
    ) { }

    public initialize(): void {
        const gateway = new SocketGateway(this.io);

        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            registerUserHandlers(socket, gateway, this.joinUserUC, this.userService);
            registerBoardHandlers(
                socket,
                gateway,
                this.createBoardUC,
                this.joinBoardUC,
                this.boardService,
                this.noteService,
                this.userRepo
            );
            registerNoteHandlers(
                socket,
                gateway,
                this.createNoteUC,
                this.updateNoteUC,
                this.deleteNoteUC,
                this.noteService,
                this.userRepo
            );
            registerCommentHandlers(socket, gateway, this.addCommentUC, this.userRepo);

            socket.on('disconnect', handleDisconnect(socket, this.userRepo, gateway, this.userService));
        });
    }
}