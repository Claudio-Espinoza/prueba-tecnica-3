import { User } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user';
import { Role, RoleType } from '../../../domain/entities/role';
import { UserId } from '../../../domain/value-objects/user-id';
import { supabase } from '../../persistence/config/client';

const USERS_TABLE = 'users';
const ROLES_TABLE = 'user_board_roles';

export class SupabaseUserRepository implements UserRepository {
    async save(user: User): Promise<void> {
        const { error: userError } = await supabase.from(USERS_TABLE).upsert({
            id: user.getId().value,
            name: user.getName(),
            socket_id: user.getSocketId(),
            connected_at: user.props.connectedAt.toISOString()
        });
        if (userError) throw userError;

        for (const [boardId, role] of user.getBoardRoles().entries()) {
            const { error: roleError } = await supabase.from(ROLES_TABLE).upsert({
                user_id: user.getId().value,
                board_id: boardId,
                role: role.toString()
            });
            if (roleError) throw roleError;
        }
    }

    async findBySocketId(socketId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .select('*, user_board_roles(*)')
            .eq('socket_id', socketId)
            .single();

        if (error?.code === 'PGRST116') return null;
        if (error) throw error;

        return this.mapRowToUser(data);
    }

    async findAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .select('*, user_board_roles(*)');

        if (error) throw error;
        return (data || []).map(row => this.mapRowToUser(row));
    }

    async deleteBySocketId(socketId: string): Promise<void> {
        const { error } = await supabase
            .from(USERS_TABLE)
            .delete()
            .eq('socket_id', socketId);
        if (error) throw error;
    }

    private mapRowToUser(row: any): User {
        const user = new User({
            id: new UserId(row.id),
            name: row.name,
            socketId: row.socket_id,
            connectedAt: new Date(row.connected_at),
            roles: new Map()
        });

        if (row.user_board_roles && Array.isArray(row.user_board_roles)) {
            row.user_board_roles.forEach((roleRow: any) => {
                user.setRoleInBoard(roleRow.board_id, Role.create(roleRow.role as RoleType));
            });
        }

        return user;
    }
}