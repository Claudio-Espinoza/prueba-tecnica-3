import { BoardRepository } from '../../domain/repositories/board';
import { BoardDTO } from '../dtos/board-dto';
import { BoardId } from '../../domain/value-objects/board-id';

export class BoardService {
    constructor(private boardRepository: BoardRepository) { }

    async getAllBoards(): Promise<BoardDTO[]> {
        const boards = await this.boardRepository.findAll();
        return boards.map(b => b.toJSON() as BoardDTO);
    }

    async getBoardById(boardId: string): Promise<BoardDTO | null> {
        const board = await this.boardRepository.findById(BoardId.create(boardId));
        return board ? (board.toJSON() as BoardDTO) : null;
    }
}