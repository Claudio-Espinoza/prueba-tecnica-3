import { Socket } from 'socket.io';
import { SocketGateway } from '../../gateway/socket';
import { SOCKET_EVENTS } from '../events';
import { CreateBoard } from '../../../application/usecases/create-board';
import { JoinBoard } from '../../../application/usecases/join-board';
import { BoardService } from '../../../application/services/board';
import { NoteService } from '../../../application/services/note';
import { UserRepository } from '../../../domain/repositories/user';
import { boardUsersService } from '../../../infrastructure/board-users';

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

            // El creador se une a la sala del board
            socket.join(board.getId().value);
            console.log(`✅ Creador ${user.getName()} se unió a la sala ${board.getId().value}`);

            // Agregar el creador a la lista de usuarios del board automáticamente
            const creatorData = {
                socketId: socket.id,
                name: user.getName(),
                role: 'editor'
            };
            boardUsersService.addUserToBoard(board.getId().value, creatorData);
            console.log(`✅ Creador ${user.getName()} agregado a boardUsersService para ${board.getId().value}`);

            const boardData = {
                ...board.toJSON(),
                creatorName: user.getName(),
                users: [creatorData]
            };

            // Emit to the creator
            socket.emit(SOCKET_EVENTS.BOARD_CREATED, boardData);

            // Broadcast to all users (except creator)
            socket.broadcast.emit(SOCKET_EVENTS.BOARD_CREATED, boardData);

            // Emitir actualización de lista de boards a TODOS para que vean el nuevo board
            const io = (socket as any).nsp.server;
            const allBoards = await boardService.getAllBoards();
            const boardsWithUsers = boardUsersService.getAllBoardsWithUsers(allBoards);
            io.emit(SOCKET_EVENTS.BOARD_LIST, { boards: boardsWithUsers, success: true });
            console.log(`📋 Board list actualizado a todos los usuarios`);

            console.log(`📌 Board created: ${board.getId().value} by ${user.getName()}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_LIST, async () => {
        try {
            const boards = await boardService.getAllBoards();
            console.log(`📋 BOARD_LIST solicitado: ${boards.length} boards encontrados`);
            
            // Agregar usuarios de cada board
            const boardsWithUsers = boardUsersService.getAllBoardsWithUsers(boards);
            
            // Log detallado de cada board
            boardsWithUsers.forEach((b: any) => {
                console.log(`  - Board "${b.name}": ${b.users?.length || 0} usuarios`, b.users);
            });
            
            socket.emit(SOCKET_EVENTS.BOARD_LIST, { boards: boardsWithUsers, success: true });
            console.log(`✅ Board list emitido al socket ${socket.id}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_JOIN, async (data: { boardId: string }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);
            if (!user) throw new Error('User not found');

            console.log(`🚪 BOARD_JOIN iniciado - socket: ${socket.id}, board: ${data.boardId}, usuario: ${user.getName()}`);

            await joinBoardUC.execute({
                userId: socket.id,
                boardId: data.boardId
            });

            socket.join(data.boardId);

            // Agregar usuario al servicio de rastreo de usuarios por board
            const userData = {
                socketId: socket.id,
                name: user.getName(),
                role: 'editor'
            };
            boardUsersService.addUserToBoard(data.boardId, userData);
            console.log(`✅ Usuario agregado al servicio de board-users`);

            const board = await boardService.getBoardById(data.boardId);
            const notes = await noteService.getNotesByBoard(data.boardId);

            // Prepare board data with creator name
            const boardData = {
                ...board.toJSON(),
                creatorName: board.toJSON().creatorName,
                users: []
            };

            // Get users in this board from the service
            const roomUsers = boardUsersService.getUsersInBoard(data.boardId);
            console.log(`📊 Usuarios en board ${data.boardId}: ${roomUsers.length}`, roomUsers);

            // Send board data with updated users list to the joining user
            const boardDataWithUsers = {
                ...boardData,
                users: roomUsers
            };
            console.log(`📤 Emitiendo board:data con ${boardDataWithUsers.users?.length || 0} usuarios`);
            socket.emit(SOCKET_EVENTS.BOARD_DATA, { board: boardDataWithUsers, notes });

            // Get the IO instance
            const io = (socket as any).nsp.server;

            // Notify ALL users (including the new user) that someone joined
            io.to(data.boardId).emit(SOCKET_EVENTS.BOARD_USER_JOINED, {
                boardId: data.boardId,
                user: userData
            });

            // Send updated users list to ALL users in the room (including the new user)
            io.to(data.boardId).emit(SOCKET_EVENTS.BOARD_USERS_UPDATED, {
                boardId: data.boardId,
                users: roomUsers
            });

            // Broadcast the updated board list to all users to reflect new user count
            const allBoards = await boardService.getAllBoards();
            const boardsWithUsers = boardUsersService.getAllBoardsWithUsers(allBoards);
            io.emit(SOCKET_EVENTS.BOARD_LIST, { boards: boardsWithUsers, success: true });

            console.log(`${user.getName()} joined board: ${data.boardId}, total users: ${roomUsers.length}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_LEAVE, async (data: { boardId: string }) => {
        try {
            const user = await userRepo.findBySocketId(socket.id);

            // Remover usuario del servicio de rastreo
            boardUsersService.removeUserFromBoard(data.boardId, socket.id);
            
            socket.leave(data.boardId);

            // Notify others that a user left
            socket.to(data.boardId).emit(SOCKET_EVENTS.BOARD_USER_LEFT, {
                boardId: data.boardId,
                userId: socket.id
            });

            // Get the IO instance
            const io = (socket as any).nsp.server;

            // Broadcast the updated board list to all users
            const allBoards = await boardService.getAllBoards();
            const boardsWithUsers = boardUsersService.getAllBoardsWithUsers(allBoards);
            io.emit(SOCKET_EVENTS.BOARD_LIST, { boards: boardsWithUsers, success: true });

            console.log(`User left board: ${data.boardId}`);
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });

    socket.on(SOCKET_EVENTS.BOARD_INIT, async (data: { boardId: string }) => {
        try {
            console.log(`🔄 BOARD_INIT recibido para board: ${data.boardId}`);
            const board = await boardService.getBoardById(data.boardId);
            const notes = await noteService.getNotesByBoard(data.boardId);
            
            // Obtener usuarios del board desde el servicio en memoria
            const roomUsers = boardUsersService.getUsersInBoard(data.boardId);
            console.log(`📊 BOARD_INIT: Usuarios encontrados: ${roomUsers.length}`, roomUsers);
            
            // Enviar board data con usuarios incluidos
            const boardWithUsers = {
                ...board,
                users: roomUsers
            };

            console.log(`📤 BOARD_INIT: Emitiendo board:data con ${roomUsers.length} usuarios`);
            socket.emit(SOCKET_EVENTS.BOARD_DATA, { board: boardWithUsers, notes });
        } catch (err: any) {
            gateway.sendError(socket, err.message);
        }
    });
}