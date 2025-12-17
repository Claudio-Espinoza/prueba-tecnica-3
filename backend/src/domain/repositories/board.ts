import { Board } from '../entities/board';
import { BoardId } from '../value-objects/board-id';

export interface BoardRepository {
    create(board: Board): Promise<void>;
    findById(id: BoardId): Promise<Board | null>;
    findAll(): Promise<Board[]>;
    update(board: Board): Promise<void>;
    delete(id: BoardId): Promise<void>;
}