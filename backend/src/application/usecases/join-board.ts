import { UserRepository } from '../../domain/repositories/user';
import { BoardRepository } from '../../domain/repositories/board';
import { Role, RoleType } from '../../domain/entities/role';
import { BoardId } from '../../domain/value-objects/board-id';
import { NotFoundError } from '../../domain/errors/index';

export interface JoinBoardInput {
    userId: string;
    boardId: string;
    role?: RoleType;
}

export class JoinBoard {
    constructor(
        private userRepository: UserRepository,
        private boardRepository: BoardRepository
    ) { }

    async execute(input: JoinBoardInput): Promise<void> {
        const user = await this.userRepository.findBySocketId(input.userId);
        if (!user) throw new NotFoundError('User');

        const board = await this.boardRepository.findById(BoardId.create(input.boardId));
        if (!board) throw new NotFoundError('Board');

        const role = input.role ? Role.create(input.role) : Role.viewer();
        user.setRoleInBoard(input.boardId, role);

        await this.userRepository.save(user);
    }
}