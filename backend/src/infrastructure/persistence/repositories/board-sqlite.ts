import { Board } from '../../../domain/entities/board.js';
import { BoardRepository } from '../../../domain/repositories/board.js';
import { BoardId } from '../../../domain/value-objects/board-id.js';
import { allAsync, getAsync, runAsync } from '../config/sqlite.js';

export class SQLiteBoardRepository implements BoardRepository {
    async findById(id: BoardId): Promise<Board | null> {
        const row = await getAsync(
            'SELECT id, name, description, owner_id, created_at, updated_at FROM boards WHERE id = ?',
            [id.value]
        );

        if (!row) return null;

        const userRows = await allAsync(
            `SELECT DISTINCT ubr.user_id FROM user_board_roles ubr WHERE ubr.board_id = ?`,
            [id.value]
        );

        const users = userRows.map((r: any) => r.user_id);

        return new Board(
            {
                id: { value: row.id },
                name: row.name,
                description: row.description || '',
                ownerId: row.owner_id,
                users,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            },
            { id: row.id }
        );
    }

    async findAll(): Promise<Board[]> {
        const rows = await allAsync(
            'SELECT id, name, description, owner_id, created_at, updated_at FROM boards'
        );

        const boards: Board[] = [];
        for (const row of rows) {
            const userRows = await allAsync(
                'SELECT DISTINCT ubr.user_id FROM user_board_roles ubr WHERE ubr.board_id = ?',
                [row.id]
            );

            const users = userRows.map((r: any) => r.user_id);

            boards.push(new Board(
                {
                    id: { value: row.id },
                    name: row.name,
                    description: row.description || '',
                    ownerId: row.owner_id,
                    users,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                },
                { id: row.id }
            ));
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
            const userRows = await allAsync(
                'SELECT DISTINCT ubr.user_id FROM user_board_roles ubr WHERE ubr.board_id = ?',
                [row.id]
            );

            const users = userRows.map((r: any) => r.user_id);

            boards.push(new Board(
                {
                    id: { value: row.id },
                    name: row.name,
                    description: row.description || '',
                    ownerId: row.owner_id,
                    users,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                },
                { id: row.id }
            ));
        }
        return boards;
    }

    async save(board: Board): Promise<void> {
        const id = board.getId().value;
        const name = board.getName();
        const description = board.getDescription();
        const ownerId = board.getOwnerId();
        const createdAt = board.getCreatedAt();
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

        const users = board.getUsers();
        const existingUsers = await allAsync(
            'SELECT user_id FROM user_board_roles WHERE board_id = ?',
            [id]
        );
        const existingUserIds = existingUsers.map((r: any) => r.user_id);

        for (const userId of users) {
            if (!existingUserIds.includes(userId)) {
                await runAsync(
                    'INSERT INTO user_board_roles (user_id, board_id, role) VALUES (?, ?, ?)',
                    [userId, id, userId === ownerId ? 'editor' : 'viewer']
                );
            }
        }

        for (const userId of existingUserIds) {
            if (!users.includes(userId)) {
                await runAsync(
                    'DELETE FROM user_board_roles WHERE user_id = ? AND board_id = ?',
                    [userId, id]
                );
            }
        }
    }

    async delete(id: BoardId): Promise<void> {
        await runAsync('DELETE FROM user_board_roles WHERE board_id = ?', [id.value]);
        await runAsync('DELETE FROM notes WHERE board_id = ?', [id.value]);
        await runAsync('DELETE FROM boards WHERE id = ?', [id.value]);
    }
}
