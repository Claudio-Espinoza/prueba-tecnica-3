import { v4 as uuid } from 'uuid';

export interface CommentProps {
    id: string;
    user: string;
    text: string;
    timestamp: number;
}

export class Comment {
    constructor(public props: CommentProps) {
        if (!props.text || props.text.trim() === '') {
            throw new Error('Comment text required');
        }
        if (!props.user || props.user.trim() === '') {
            throw new Error('Comment user required');
        }
    }

    static create(user: string, text: string): Comment {
        return new Comment({
            id: uuid(),
            user,
            text,
            timestamp: Date.now()
        });
    }

    getId(): string {
        return this.props.id;
    }

    getUser(): string {
        return this.props.user;
    }

    getText(): string {
        return this.props.text;
    }

    getTimestamp(): number {
        return this.props.timestamp;
    }

    toJSON(): CommentProps {
        return { ...this.props };
    }
}