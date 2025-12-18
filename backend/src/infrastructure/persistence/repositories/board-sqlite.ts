import { Board } from '../../../domain/entities/board.js';
import { BoardRepository } from '../../../domain/repositories/board.js';
import { BoardId } from '../../../domain/value-objects/board-id.js';
import { UserId } from '../../../domain/value-objects/user-id.js';
import { allAsync, getAsync, runAsync } from '../config/sqlite.js';

export class SQLiteBoardRepository implements BoardRepository {
    async findById(id: BoardId): Promise<Board | null> {
        const row = await getAsync(
            'SELECT id, name, description, owner_id, created_at, updated_at FROM boards WHERE id = ?',
            [id.value]
        );

        if (!row) return null;

        return new Board({
            id: new BoardId(row.id),
            name: row.name,
            description: row.description || '',
            ownerId: new UserId(row.owner_id),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }

    async findAll(): Promise<Board[]> {
        const rows = await allAsync(
            'SELECT id, name, description, owner_id, created_at, updated_at FROM boards'
        );

        const boards: Board[] = [];
        for (const row of rows) {
            boards.push(new Board({
                id: new BoardId(row.id),
                name: row.name,
                description: row.description || '',
                ownerId: new UserId(row.owner_id),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at)
            }));
        }
        return boards;
    }

    async findByOwnerId(ownerId: string): Promise<Board[]> {
        const rows = await allAsync(
            'SELECT id, name, description, owner_id, created_at, updated_at FROM boards WHERE owner_id = ?',
            [ownerId]
        );

        const boards: Board[] = [];
        for (const row of rows) {
            boards.push(new Board({
                id: new BoardId(row.id),
                name: row.name,
                description: row.description || '',
                ownerId: new UserId(row.owner_id),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at)
            }));
        }
        return boards;
    }

    async create(board: Board): Promise<void> {
        const id = board.getId().value;
        const name = board.getName();
        const description = board.getDescription();
        const ownerId = board.getOwnerId().value;
        const createdAt = board.props.createdAt.toISOString();
        const updatedAt = new Date().toISOString();

        await runAsync(
            'INSERT INTO boards (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, description, ownerId, createdAt, updatedAt]
        );
    }

    async update(board: Board): Promise<void> {
        const id = board.getId().value;
        const name = board.getName();
        const description = board.getDescription();
        const updatedAt = new Date().toISOString();

        await runAsync(
            'UPDATE boards SET name = ?, description = ?, updated_at = ? WHERE id = ?',
            [name, description, updatedAt, id]
        );
    }

    async save(board: Board): Promise<void> {
        const id = board.getId().value;
        const name = board.getName();
        const description = board.getDescription();
        const ownerId = board.getOwnerId().value;
        const createdAt = board.props.createdAt.toISOString();
        const updatedAt = new Date().toISOString();

        const existing = await getAsync('SELECT id FROM boards WHERE id = ?', [id]);

        if (!existing) {
            await runAsync(
                'INSERT INTO boards (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [id, name, description, ownerId, createdAt, updatedAt]
            );
        } else {
            await runAsync(
                'UPDATE boards SET name = ?, description = ?, updated_at = ? WHERE id = ?',
                [name, description, updatedAt, id]
            );
        }
    }

    async delete(id: BoardId): Promise<void> {
        await runAsync('DELETE FROM user_board_roles WHERE board_id = ?', [id.value]);
        await runAsync('DELETE FROM notes WHERE board_id = ?', [id.value]);
        await runAsync('DELETE FROM boards WHERE id = ?', [id.value]);
    }
}
