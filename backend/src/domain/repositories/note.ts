import { Note } from '../entities/note';
import { NoteId } from '../value-objects/note-id';

export interface NoteRepository {
    create(note: Note): Promise<void>;
    findById(id: NoteId): Promise<Note | null>;
    findByBoard(boardId: string): Promise<Note[]>;
    update(note: Note): Promise<void>;
    delete(id: NoteId): Promise<void>;
}