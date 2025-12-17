import { CommentProps } from '../../domain/entities/comment';

export interface NoteDTO {
    id: string;
    boardId: string;
    title: string;
    content: string;
    x: number;
    y: number;
    updatedBy: string;
    comments: CommentProps[];
    createdAt: string;
    updatedAt: string;
    version: number;
}

export interface CommentDTO {
    id: string;
    user: string;
    text: string;
    timestamp: number;
}