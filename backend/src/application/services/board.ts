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

        for (const board of boards) {
            const boardData = board.toJSON();
            try {
                const owner = await this.userRepository.findBySocketId(boardData.ownerId);
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
            const owner = await this.userRepository.findBySocketId(boardData.ownerId);
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