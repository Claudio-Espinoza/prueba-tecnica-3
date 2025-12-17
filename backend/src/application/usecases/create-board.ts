import { Board } from '../../domain/entities/board';
import { BoardRepository } from '../../domain/repositories/board';
import { UserId } from '../../domain/value-objects/user-id';
import { ValidationError } from '../../domain/errors/index';

export interface CreateBoardInput {
    name: string;
    description?: string;
    ownerId: string;
}

export class CreateBoard {
    constructor(private boardRepository: BoardRepository) { }

    async execute(input: CreateBoardInput): Promise<Board> {
        if (!input.name?.trim()) {
            throw new ValidationError('Board name is required');
        }

        const board = Board.create(
            input.name,
            input.description || '',
            new UserId(input.ownerId)
        );

        await this.boardRepository.create(board);
        return board;
    }
}