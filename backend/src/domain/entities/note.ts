// backend/src/domain/entities/Note.ts
import { NoteId } from '../value-objects/note-id';
import { Position } from '../value-objects/position';
import { Comment, CommentProps } from './comment';

export interface NoteProps {
    id: NoteId;
    boardId: string;
    title: string;
    content: string;
    position: Position;
    updatedBy: string;
    comments: CommentProps[];
    createdAt: Date;
    updatedAt: Date;
    version: number;
}

export class Note {
    constructor(public props: NoteProps) {
        if (!props.title || props.title.trim() === '') {
            throw new Error('Note title required');
        }
        if (!props.boardId) {
            throw new Error('BoardId required');
        }
    }

    static create(
        boardId: string,
        title: string,
        content: string,
        x: number,
        y: number,
        updatedBy: string
    ): Note {
        return new Note({
            id: new NoteId(),
            boardId,
            title,
            content: content || '',
            position: Position.create(x, y),
            updatedBy,
            comments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 0
        });
    }

    getId(): NoteId {
        return this.props.id;
    }

    getBoardId(): string {
        return this.props.boardId;
    }

    getTitle(): string {
        return this.props.title;
    }

    getContent(): string {
        return this.props.content;
    }

    getPosition(): Position {
        return this.props.position;
    }

    getUpdatedBy(): string {
        return this.props.updatedBy;
    }

    getComments(): CommentProps[] {
        return [...this.props.comments];
    }

    getVersion(): number {
        return this.props.version;
    }

    updateContent(content: string, updatedBy: string): void {
        if (!content || content.trim() === '') {
            throw new Error('Content required');
        }
        this.props.content = content;
        this.props.updatedBy = updatedBy;
        this.props.updatedAt = new Date();
        this.props.version++;
    }

    updateTitle(title: string, updatedBy: string): void {
        if (!title || title.trim() === '') {
            throw new Error('Title required');
        }
        this.props.title = title;
        this.props.updatedBy = updatedBy;
        this.props.updatedAt = new Date();
        this.props.version++;
    }

    movePosition(x: number, y: number, updatedBy: string): void {
        this.props.position = Position.create(x, y);
        this.props.updatedBy = updatedBy;
        this.props.updatedAt = new Date();
        this.props.version++;
    }

    addComment(comment: Comment): void {
        this.props.comments.push(comment.props);
        this.props.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.props.id.value,
            boardId: this.props.boardId,
            title: this.props.title,
            content: this.props.content,
            x: this.props.position.x,
            y: this.props.position.y,
            updatedBy: this.props.updatedBy,
            comments: this.props.comments,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
            version: this.props.version
        };
    }
}