import { User } from '../../../domain/entities/user.js';
import { UserRepository } from '../../../domain/repositories/user.js';
import { UserId } from '../../../domain/value-objects/user-id.js';
import { Role } from '../../../domain/entities/role.js';
import { allAsync, getAsync, runAsync } from '../config/sqlite.js';

export class SQLiteUserRepository implements UserRepository {
    async findById(id: UserId): Promise<User | null> {
        const row = await getAsync(
            'SELECT id, name, socket_id, connected_at FROM users WHERE id = ?',
            [id.value]
        );

        if (!row) return null;

        const roles = await allAsync(
            'SELECT board_id, role FROM user_board_roles WHERE user_id = ?',
            [id.value]
        );

        const rolesMap = new Map<string, Role>();
        roles.forEach((r: any) => {
            rolesMap.set(r.board_id, r.role === 'editor' ? Role.editor() : Role.viewer());
        });

        return new User({
            id: new UserId(row.id),
            name: row.name,
            socketId: row.socket_id,
            connectedAt: new Date(row.connected_at),
            roles: rolesMap
        });
    }

    async findBySocketId(socketId: string): Promise<User | null> {
        const row = await getAsync(
            'SELECT id, name, socket_id, connected_at FROM users WHERE socket_id = ?',
            [socketId]
        );

        if (!row) return null;

        const roles = await allAsync(
            'SELECT board_id, role FROM user_board_roles WHERE user_id = ?',
            [row.id]
        );

        const rolesMap = new Map<string, Role>();
        roles.forEach((r: any) => {
            rolesMap.set(r.board_id, r.role === 'editor' ? Role.editor() : Role.viewer());
        });

        return new User({
            id: new UserId(row.id),
            name: row.name,
            socketId: row.socket_id,
            connectedAt: new Date(row.connected_at),
            roles: rolesMap
        });
    }

    async findAll(): Promise<User[]> {
        const rows = await allAsync('SELECT id, name, socket_id, connected_at FROM users');

        const users: User[] = [];
        for (const row of rows) {
            const roles = await allAsync(
                'SELECT board_id, role FROM user_board_roles WHERE user_id = ?',
                [row.id]
            );

            const rolesMap = new Map<string, Role>();
            roles.forEach((r: any) => {
                rolesMap.set(r.board_id, r.role === 'editor' ? Role.editor() : Role.viewer());
            });

            users.push(new User({
                id: new UserId(row.id),
                name: row.name,
                socketId: row.socket_id,
                connectedAt: new Date(row.connected_at),
                roles: rolesMap
            }));
        }
        return users;
    }

    async save(user: User): Promise<void> {
        const id = user.getId().value;
        const name = user.getName();
        const socketId = user.getSocketId();
        const connectedAt = user.props.connectedAt.toISOString();

        const existing = await getAsync('SELECT id FROM users WHERE id = ?', [id]);

        if (!existing) {
            await runAsync(
                'INSERT INTO users (id, name, socket_id, connected_at) VALUES (?, ?, ?, ?)',
                [id, name, socketId, connectedAt]
            );
        } else {
            await runAsync(
                'UPDATE users SET name = ?, socket_id = ? WHERE id = ?',
                [name, socketId, id]
            );
        }

        const roles = user.getBoardRoles();
        for (const [boardId, role] of roles.entries()) {
            const existing = await getAsync(
                'SELECT user_id FROM user_board_roles WHERE user_id = ? AND board_id = ?',
                [id, boardId]
            );

            const roleStr = role.isEditor() ? 'editor' : 'viewer';

            if (!existing) {
                await runAsync(
                    'INSERT INTO user_board_roles (user_id, board_id, role) VALUES (?, ?, ?)',
                    [id, boardId, roleStr]
                );
            } else {
                await runAsync(
                    'UPDATE user_board_roles SET role = ? WHERE user_id = ? AND board_id = ?',
                    [roleStr, id, boardId]
                );
            }
        }
    }

    async delete(id: UserId): Promise<void> {
        await runAsync('DELETE FROM user_board_roles WHERE user_id = ?', [id.value]);
        await runAsync('DELETE FROM users WHERE id = ?', [id.value]);
    }

    async deleteBySocketId(socketId: string): Promise<void> {
        const user = await this.findBySocketId(socketId);
        if (user) {
            await this.delete(user.getId());
        }
    }
}
