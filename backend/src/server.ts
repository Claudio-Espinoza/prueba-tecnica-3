import { createApp, setDatabaseStatus } from './app';
import { env } from './infrastructure/enviroment/env';
import { SQLiteBoardRepository } from './infrastructure/persistence/repositories/board-sqlite';
import { SQLiteNoteRepository } from './infrastructure/persistence/repositories/note-sqlite';
import { SQLiteUserRepository } from './infrastructure/persistence/repositories/user-sqlite';
import { initializeDatabase, closeDatabase } from './infrastructure/persistence/config/sqlite';
import { CreateBoard } from './application/usecases/create-board';
import { JoinBoard } from './application/usecases/join-board';
import { CreateNote } from './application/usecases/create-note';
import { UpdateNote } from './application/usecases/update-note';
import { DeleteNote } from './application/usecases/delete-note';
import { AddComment } from './application/usecases/add-comment';
import { JoinUser } from './application/usecases/join-user';
import { BoardService } from './application/services/board';
import { NoteService } from './application/services/note';
import { UserService } from './application/services/user';
import { SocketAdapter } from './infrastructure/socket/adapter';

async function startServer() {
    try {
        console.log('Starting backend server...');
        console.log(`Environment: ${env.nodeEnv}`);

        console.log('Using SQLite database (persistent storage)');
        await initializeDatabase();
        setDatabaseStatus(true);

        const boardRepo = new SQLiteBoardRepository();
        const noteRepo = new SQLiteNoteRepository();
        const userRepo = new SQLiteUserRepository();

        const createBoardUC = new CreateBoard(boardRepo);
        const joinBoardUC = new JoinBoard(userRepo, boardRepo);
        const createNoteUC = new CreateNote(noteRepo);
        const updateNoteUC = new UpdateNote(noteRepo);
        const deleteNoteUC = new DeleteNote(noteRepo);
        const addCommentUC = new AddComment(noteRepo);

        const { server, io } = createApp(
            createBoardUC,
            createNoteUC,
            updateNoteUC,
            deleteNoteUC,
            addCommentUC
        );
        const joinUserUC = new JoinUser(userRepo);

        const boardService = new BoardService(boardRepo);
        const noteService = new NoteService(noteRepo);
        const userService = new UserService(userRepo);

        const socketAdapter = new SocketAdapter(
            io,
            boardService,
            noteService,
            userService,
            userRepo,
            createBoardUC,
            joinBoardUC,
            createNoteUC,
            updateNoteUC,
            deleteNoteUC,
            addCommentUC,
            joinUserUC
        );

        socketAdapter.initialize();
        console.log('Socket handlers registered');

        const port = env.port;
        server.listen(port, () => {
            console.log(`\nBackend running on http://localhost:${port}`);
            console.log(`WebSocket ready at ws://localhost:${port}`);
            console.log(`Health check: GET http://localhost:${port}/health\n`);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            server.close(() => {
                closeDatabase().then(() => {
                    console.log('Server closed');
                    process.exit(0);
                });
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}


startServer();