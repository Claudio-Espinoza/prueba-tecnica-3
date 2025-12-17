import { UserId } from '../value-objects/user-id';
import { Role } from './role';

export interface UserProps {
    id: UserId;
    name: string;
    socketId: string;
    connectedAt: Date;
    roles: Map<string, Role>;
}

export class User {
    constructor(public props: UserProps) {
        if (!props.name || props.name.trim() === '') {
            throw new Error('User name required');
        }
    }

    static create(socketId: string, name: string): User {
        return new User({
            id: new UserId(socketId),
            name,
            socketId,
            connectedAt: new Date(),
            roles: new Map()
        });
    }

    getId(): UserId {
        return this.props.id;
    }

    getName(): string {
        return this.props.name;
    }

    getSocketId(): string {
        return this.props.socketId;
    }

    getRoleInBoard(boardId: string): Role {
        return this.props.roles.get(boardId) || Role.viewer();
    }

    setRoleInBoard(boardId: string, role: Role): void {
        this.props.roles.set(boardId, role);
    }

    canEditBoard(boardId: string): boolean {
        return this.getRoleInBoard(boardId).isEditor();
    }

    canViewBoard(boardId: string): boolean {
        return this.props.roles.has(boardId);
    }

    getBoardRoles(): Map<string, Role> {
        return this.props.roles;
    }

    toJSON() {
        return {
            id: this.props.id.value,
            name: this.props.name,
            socketId: this.props.socketId,
            connectedAt: this.props.connectedAt.toISOString(),
            roles: Object.fromEntries(
                Array.from(this.props.roles.entries()).map(([boardId, role]) => [
                    boardId,
                    role.toString()
                ])
            )
        };
    }
}