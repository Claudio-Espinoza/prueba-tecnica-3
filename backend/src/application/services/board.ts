import { BoardRepository } from '../../domain/repositories/board';
import { UserRepository } from '../../domain/repositories/user';
import { BoardDTO } from '../dtos/board-dto';
import { BoardId } from '../../domain/value-objects/board-id';

export class BoardService {
    constructor(
        private boardRepository: BoardRepository,
        private userRepository: UserRepository
    ) { }

    async getAllBoards(): Promise<any[]> {
        const boards = await this.boardRepository.findAll();
        const boardsWithUserNames: any[] = [];
        const allUsers = await this.userRepository.findAll();

        for (const board of boards) {
            const boardData = board.toJSON();
            try {
                // Buscar el usuario por ID (ownerId es el UserId, no el socketId)
                const owner = allUsers.find(u => u.getId().value === boardData.ownerId);
                boardsWithUserNames.push({
                    ...boardData,
                    creatorName: owner?.getName() || 'Desconocido',
                    users: []
                });
            } catch {
                boardsWithUserNames.push({
                    ...boardData,
                    creatorName: 'Desconocido',
                    users: []
                });
            }
        }

        return boardsWithUserNames;
    }

    async getBoardById(boardId: string): Promise<any | null> {
        const board = await this.boardRepository.findById(BoardId.create(boardId));
        if (!board) return null;

        const boardData = board.toJSON();
        try {
            const allUsers = await this.userRepository.findAll();
            // Buscar el usuario por ID (ownerId es el UserId, no el socketId)
            const owner = allUsers.find(u => u.getId().value === boardData.ownerId);
            return {
                ...boardData,
                creatorName: owner?.getName() || 'Desconocido',
                users: []
            };
        } catch {
            return {
                ...boardData,
                creatorName: 'Desconocido',
                users: []
            };
        }
    }
}