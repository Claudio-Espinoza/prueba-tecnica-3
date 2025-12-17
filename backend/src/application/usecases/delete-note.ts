import { NoteRepository } from '../../domain/repositories/note';
import { NoteId } from '../../domain/value-objects/note-id';
import { NotFoundError, PermissionError } from '../../domain/errors/index';
import { User } from '../../domain/entities/user';

export class DeleteNote {
    constructor(private noteRepository: NoteRepository) { }

    async execute(boardId: string, noteId: string, user: User): Promise<void> {
        if (!user.canEditBoard(boardId)) {
            throw new PermissionError('Must be editor to delete notes');
        }

        const note = await this.noteRepository.findById(NoteId.create(noteId));
        if (!note) throw new NotFoundError('Note');

        if (note.getBoardId() !== boardId) {
            throw new PermissionError('Note does not belong to this board');
        }

        await this.noteRepository.delete(NoteId.create(noteId));
    }
}