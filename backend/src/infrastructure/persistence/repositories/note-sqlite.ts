import { Note } from '../../../domain/entities/note.js';
import { Comment } from '../../../domain/entities/comment.js';
import { NoteRepository } from '../../../domain/repositories/note.js';
import { NoteId } from '../../../domain/value-objects/note-id.js';
import { Position } from '../../../domain/value-objects/position.js';
import { allAsync, getAsync, runAsync } from '../config/sqlite.js';

export class SQLiteNoteRepository implements NoteRepository {
    async findById(id: NoteId): Promise<Note | null> {
        const row = await getAsync(
            'SELECT id, board_id, title, content, x, y, updated_by, version, created_at, updated_at FROM notes WHERE id = ?',
            [id.value]
        );

        if (!row) return null;

        const commentRows = await allAsync(
            'SELECT id, user_name, text, created_at FROM comments WHERE note_id = ?',
            [id.value]
        );

        const comments = commentRows.map((c: any) =>
            new Comment(
                { id: c.id, noteId: row.id, userName: c.user_name, text: c.text, createdAt: c.created_at },
                { id: c.id }
            )
        );

        return new Note(
            {
                id: { value: row.id },
                boardId: row.board_id,
                title: row.title,
                content: row.content || '',
                position: new Position(row.x, row.y),
                comments,
                updatedBy: row.updated_by,
                version: row.version,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            },
            { id: row.id }
        );
    }

    async findByBoardId(boardId: string): Promise<Note[]> {
        const rows = await allAsync(
            'SELECT id, board_id, title, content, x, y, updated_by, version, created_at, updated_at FROM notes WHERE board_id = ?',
            [boardId]
        );

        const notes: Note[] = [];
        for (const row of rows) {
            const commentRows = await allAsync(
                'SELECT id, user_name, text, created_at FROM comments WHERE note_id = ?',
                [row.id]
            );

            const comments = commentRows.map((c: any) =>
                new Comment(
                    { id: c.id, noteId: row.id, userName: c.user_name, text: c.text, createdAt: c.created_at },
                    { id: c.id }
                )
            );

            notes.push(new Note(
                {
                    id: { value: row.id },
                    boardId: row.board_id,
                    title: row.title,
                    content: row.content || '',
                    position: new Position(row.x, row.y),
                    comments,
                    updatedBy: row.updated_by,
                    version: row.version,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                },
                { id: row.id }
            ));
        }
        return notes;
    }

    async findAll(): Promise<Note[]> {
        const rows = await allAsync(
            'SELECT id, board_id, title, content, x, y, updated_by, version, created_at, updated_at FROM notes'
        );

        const notes: Note[] = [];
        for (const row of rows) {
            const commentRows = await allAsync(
                'SELECT id, user_name, text, created_at FROM comments WHERE note_id = ?',
                [row.id]
            );

            const comments = commentRows.map((c: any) =>
                new Comment(
                    { id: c.id, noteId: row.id, userName: c.user_name, text: c.text, createdAt: c.created_at },
                    { id: c.id }
                )
            );

            notes.push(new Note(
                {
                    id: { value: row.id },
                    boardId: row.board_id,
                    title: row.title,
                    content: row.content || '',
                    position: new Position(row.x, row.y),
                    comments,
                    updatedBy: row.updated_by,
                    version: row.version,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                },
                { id: row.id }
            ));
        }
        return notes;
    }

    async save(note: Note): Promise<void> {
        const id = note.getId().value;
        const boardId = note.getBoardId();
        const title = note.getTitle();
        const content = note.getContent();
        const position = note.getPosition();
        const updatedBy = note.getUpdatedBy();
        const version = note.getVersion();
        const createdAt = note.getCreatedAt();
        const updatedAt = new Date().toISOString();

        const existing = await getAsync('SELECT id FROM notes WHERE id = ?', [id]);

        if (!existing) {
            await runAsync(
                'INSERT INTO notes (id, board_id, title, content, x, y, updated_by, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, boardId, title, content, position.x, position.y, updatedBy, version, createdAt, updatedAt]
            );
        } else {
            await runAsync(
                'UPDATE notes SET title = ?, content = ?, x = ?, y = ?, updated_by = ?, version = ?, updated_at = ? WHERE id = ?',
                [title, content, position.x, position.y, updatedBy, version, updatedAt, id]
            );
        }

        const comments = note.getComments();
        for (const comment of comments) {
            const commentId = comment.getId();
            const existingComment = await getAsync('SELECT id FROM comments WHERE id = ?', [commentId]);

            if (!existingComment) {
                await runAsync(
                    'INSERT INTO comments (id, note_id, user_name, text, created_at) VALUES (?, ?, ?, ?, ?)',
                    [commentId, id, comment.getUserName(), comment.getText(), comment.getCreatedAt()]
                );
            }
        }
    }

    async delete(id: NoteId): Promise<void> {
        await runAsync('DELETE FROM comments WHERE note_id = ?', [id.value]);
        await runAsync('DELETE FROM notes WHERE id = ?', [id.value]);
    }
}
