import { UserRepository } from '../../domain/repositories/user';

export class UserService {
    constructor(private userRepository: UserRepository) { }

    async getAllUsers() {
        const users = await this.userRepository.findAll();
        return users.map(u => u.toJSON());
    }

    async getUsersInBoard(boardId: string) {
        const users = await this.userRepository.findAll();
        return users
            .filter(u => u.canViewBoard(boardId))
            .map(u => ({
                id: u.getId().value,
                name: u.getName(),
                role: u.getRoleInBoard(boardId).toString()
            }));
    }
}