import { User } from '../../domain/entities/user';
import { PermissionError } from '../../domain/errors/index';

export function requireEditor(user: User, boardId: string): void {
    if (!user.canEditBoard(boardId)) {
        throw new PermissionError('Must be editor to perform this action');
    }
}

export function requireBoardAccess(user: User, boardId: string): void {
    if (!user.canViewBoard(boardId)) {
        throw new PermissionError('Must have access to this board');
    }
}