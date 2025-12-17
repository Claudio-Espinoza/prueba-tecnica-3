import { NoteRepository } from '../../domain/repositories/note';
import { NoteId } from '../../domain/value-objects/note-id';
import {
    NotFoundError,
    PermissionError
} from '../../domain/errors/index';
import { User } from '../../domain/entities/user';

export interface UpdateNoteInput {
    boardId: string;
    noteId: string;
    title?: string;
    content?: string;
    x?: number;
    y?: number;
    user: User;
}

export class UpdateNote {
    constructor(private noteRepository: NoteRepository) { }

    async execute(input: UpdateNoteInput): Promise<void> {
        if (!input.user.canEditBoard(input.boardId)) {
            throw new PermissionError('Must be editor to update notes');
        }

        const note = await this.noteRepository.findById(NoteId.create(input.noteId));
        if (!note) throw new NotFoundError('Note');

        if (note.getBoardId() !== input.boardId) {
            throw new PermissionError('Note does not belong to this board');
        }

        if (input.title !== undefined) {
            note.updateTitle(input.title, input.user.getName());
        }

        if (input.content !== undefined) {
            note.updateContent(input.content, input.user.getName());
        }

        if (input.x !== undefined && input.y !== undefined) {
            note.movePosition(input.x, input.y, input.user.getName());
        }

        await this.noteRepository.update(note);
    }
}