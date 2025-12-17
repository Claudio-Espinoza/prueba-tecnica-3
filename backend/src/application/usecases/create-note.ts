import { Note } from '../../domain/entities/note';
import { NoteRepository } from '../../domain/repositories/note';
import { ValidationError, PermissionError } from '../../domain/errors/index';
import { User } from '../../domain/entities/user';

export interface CreateNoteInput {
    boardId: string;
    title: string;
    content?: string;
    x: number;
    y: number;
    user: User;
}

export class CreateNote {
    constructor(private noteRepository: NoteRepository) { }

    async execute(input: CreateNoteInput): Promise<Note> {
        if (!input.user.canEditBoard(input.boardId)) {
            throw new PermissionError('Must be editor to create notes');
        }

        if (!input.title?.trim()) {
            throw new ValidationError('Note title is required');
        }

        if (input.x === undefined || input.y === undefined) {
            throw new ValidationError('Position (x, y) is required');
        }

        const note = Note.create(
            input.boardId,
            input.title,
            input.content || '',
            input.x,
            input.y,
            input.user.getName()
        );

        await this.noteRepository.create(note);
        return note;
    }
}