import { Note } from '../../../domain/entities/note';
import { NoteId } from '../../../domain/value-objects/note-id';
import { NoteRepository } from '../../../domain/repositories/note';
import { supabase } from '../../persistence/config/client';

const NOTES_TABLE = 'notes';
const COMMENTS_TABLE = 'comments';

export class SupabaseNoteRepository implements NoteRepository {
    async create(note: Note): Promise<void> {
        const { error } = await supabase.from(NOTES_TABLE).insert({
            id: note.getId().value,
            board_id: note.getBoardId(),
            title: note.getTitle(),
            content: note.getContent(),
            x: note.getPosition().x,
            y: note.getPosition().y,
            updated_by: note.getUpdatedBy(),
            version: note.getVersion(),
            created_at: note.props.createdAt.toISOString(),
            updated_at: note.props.updatedAt.toISOString()
        });
        if (error) throw error;
    }

    async findById(id: NoteId): Promise<Note | null> {
        const { data, error } = await supabase
            .from(NOTES_TABLE)
            .select('*, comments(*)')
            .eq('id', id.value)
            .single();

        if (error?.code === 'PGRST116') return null;
        if (error) throw error;

        return this.mapRowToNote(data);
    }

    async findByBoard(boardId: string): Promise<Note[]> {
        const { data, error } = await supabase
            .from(NOTES_TABLE)
            .select('*, comments(*)')
            .eq('board_id', boardId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => this.mapRowToNote(row));
    }

    async update(note: Note): Promise<void> {
        const { error: noteError } = await supabase
            .from(NOTES_TABLE)
            .update({
                title: note.getTitle(),
                content: note.getContent(),
                x: note.getPosition().x,
                y: note.getPosition().y,
                updated_by: note.getUpdatedBy(),
                version: note.getVersion(),
                updated_at: note.props.updatedAt.toISOString()
            })
            .eq('id', note.getId().value);

        if (noteError) throw noteError;

        const existingComments = await supabase
            .from(COMMENTS_TABLE)
            .select('id')
            .eq('note_id', note.getId().value);

        const existingIds = new Set((existingComments.data || []).map((c: any) => c.id));

        for (const comment of note.getComments()) {
            if (!existingIds.has(comment.id)) {
                const { error: commentError } = await supabase.from(COMMENTS_TABLE).insert({
                    id: comment.id,
                    note_id: note.getId().value,
                    user_name: comment.user,
                    text: comment.text,
                    created_at: new Date(comment.timestamp).toISOString()
                });
                if (commentError) throw commentError;
            }
        }
    }

    async delete(id: NoteId): Promise<void> {
        const { error } = await supabase.from(NOTES_TABLE).delete().eq('id', id.value);
        if (error) throw error;
    }

    private mapRowToNote(row: any): Note {
        const comments = (row.comments || []).map((c: any) => ({
            id: c.id,
            user: c.user_name,
            text: c.text,
            timestamp: new Date(c.created_at).getTime()
        }));

        return new Note({
            id: NoteId.create(row.id),
            boardId: row.board_id,
            title: row.title,
            content: row.content,
            position: { x: row.x, y: row.y } as any,
            updatedBy: row.updated_by,
            comments,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            version: row.version
        });
    }
}