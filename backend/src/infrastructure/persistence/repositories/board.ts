import { Board } from '../../../domain/entities/board';
import { BoardId } from '../../../domain/value-objects/board-id';
import { BoardRepository } from '../../../domain/repositories/board';
import { UserId } from '../../../domain/value-objects/user-id';
import { supabase } from '../../persistence/config/client';

const TABLE = 'boards';

export class SupabaseBoardRepository implements BoardRepository {
    async create(board: Board): Promise<void> {
        const { error } = await supabase.from(TABLE).insert({
            id: board.getId().value,
            name: board.getName(),
            description: board.getDescription(),
            owner_id: board.getOwnerId().value,
            created_at: board.props.createdAt.toISOString(),
            updated_at: board.props.updatedAt.toISOString()
        });
        if (error) throw error;
    }

    async findById(id: BoardId): Promise<Board | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id.value)
            .single();

        if (error?.code === 'PGRST116') return null;
        if (error) throw error;

        return this.mapRowToBoard(data);
    }

    async findAll(): Promise<Board[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => this.mapRowToBoard(row));
    }

    async update(board: Board): Promise<void> {
        const { error } = await supabase
            .from(TABLE)
            .update({
                name: board.getName(),
                description: board.getDescription(),
                updated_at: board.props.updatedAt.toISOString()
            })
            .eq('id', board.getId().value);

        if (error) throw error;
    }

    async delete(id: BoardId): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq('id', id.value);
        if (error) throw error;
    }

    private mapRowToBoard(row: any): Board {
        return new Board({
            id: BoardId.create(row.id),
            name: row.name,
            description: row.description || '',
            ownerId: new UserId(row.owner_id),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }
}