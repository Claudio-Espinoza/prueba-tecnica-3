import { Socket } from 'socket.io';
import { SocketGateway } from '../../gateway/socket';
import { SOCKET_EVENTS } from '../events';
import { CreateBoard } from '../../../application/usecases/create-board';
import { JoinBoard } from '../../../application/usecases/join-board';
import { BoardService } from '../../../application/services/board';
import { NoteService } from '../../../application/services/note';
import { UserRepository } from '../../../domain/repositories/user';

export function registerBoardHandlers(
    socket: Socket,
    gateway: SocketGateway,
    createBoardUC: CreateBoard,
    joinBoardUC: JoinBoard,
    boardService: BoardService,
    noteService: NoteService,
    userRepo: UserRepository
) {
    socket.on(SOCKET_EVENTS.BOARD_CREATE, async (data: { name: string; description?: string }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            const board = await createBoardUC.execute({
                name: data.name,
                description: data.description || '',
                ownerId: user.getId().value
            });

            const boardData = board.toJSON();

            // Emit to the creator
            socket.emit(SOCKET_EVENTS.BOARD_CREATED, boardData);

            // Broadcast to all users (except creator)
            socket.broadcast.emit(SOCKET_EVENTS.BOARD_CREATED, boardData);

            console.log(`Board created: ${board.getId().value} by ${user.getName()}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_LIST, async () => {
        try {
            const boards = await boardService.getAllBoards();
            socket.emit(SOCKET_EVENTS.BOARD_LIST, { boards, success: true });
            console.log(`Board list requested by ${socket.id}, found ${boards.length} boards`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_JOIN, async (data: { boardId: string }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            await joinBoardUC.execute({
                userId: socket.id,
                boardId: data.boardId
            });

            socket.join(data.boardId);

            const board = await boardService.getBoardById(data.boardId);
            const notes = await noteService.getNotesByBoard(data.boardId);

            socket.emit(SOCKET_EVENTS.BOARD_DATA, { board, notes });

            socket.to(data.boardId).emit(SOCKET_EVENTS.BOARD_USERS, {
                boardId: data.boardId
            });

            console.log(`${user.getName()} joined board: ${data.boardId}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_INIT, async (data: { boardId: string }) => {
        try {
            const board = await boardService.getBoardById(data.boardId);
            const notes = await noteService.getNotesByBoard(data.boardId);

            socket.emit(SOCKET_EVENTS.BOARD_DATA, { board, notes });
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });
}