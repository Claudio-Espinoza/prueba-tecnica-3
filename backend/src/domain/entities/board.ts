// backend/src/domain/entities/Board.ts
import { BoardId } from '../value-objects/board-id';
import { UserId } from '../value-objects/user-id';

export interface BoardProps {
    id: BoardId;
    name: string;
    description: string;
    ownerId: UserId;
    createdAt: Date;
    updatedAt: Date;
}

export class Board {
    constructor(public props: BoardProps) {
        if (!props.name || props.name.trim() === '') {
            throw new Error('Board name required');
        }
    }

    static create(name: string, description: string, ownerId: UserId): Board {
        return new Board({
            id: new BoardId(),
            name,
            description: description || '',
            ownerId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    getId(): BoardId {
        return this.props.id;
    }

    getName(): string {
        return this.props.name;
    }

    getDescription(): string {
        return this.props.description;
    }

    getOwnerId(): UserId {
        return this.props.ownerId;
    }

    getCreatedAt(): string {
        return this.props.createdAt.toISOString();
    }

    updateInfo(name: string, description: string): void {
        if (!name || name.trim() === '') {
            throw new Error('Board name required');
        }
        this.props.name = name;
        this.props.description = description || '';
        this.props.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.props.id.value,
            name: this.props.name,
            description: this.props.description,
            ownerId: this.props.ownerId.value,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
}