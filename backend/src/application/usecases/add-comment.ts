import { NoteRepository } from '../../domain/repositories/note';
import { NoteId } from '../../domain/value-objects/note-id';
import { Comment } from '../../domain/entities/comment';
import {
    NotFoundError,
    ValidationError,
    PermissionError
} from '../../domain/errors/index';
import { User } from '../../domain/entities/user';

export interface AddCommentInput {
    boardId: string;
    noteId: string;
    text: string;
    user: User;
}

export class AddComment {
    constructor(private noteRepository: NoteRepository) { }

    async execute(input: AddCommentInput): Promise<Comment> {
        if (!input.user.canViewBoard(input.boardId)) {
            throw new PermissionError('Must have access to this board to comment');
        }

        if (!input.text?.trim()) {
            throw new ValidationError('Comment text is required');
        }

        const note = await this.noteRepository.findById(NoteId.create(input.noteId));
        if (!note) throw new NotFoundError('Note');

        if (note.getBoardId() !== input.boardId) {
            throw new PermissionError('Note does not belong to this board');
        }

        const comment = Comment.create(input.user.getName(), input.text);
        note.addComment(comment);
        await this.noteRepository.update(note);

        return comment;
    }
}