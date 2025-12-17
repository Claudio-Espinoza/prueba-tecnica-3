// backend/src/application/usecases/JoinUser.ts
import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user';
import { ValidationError } from '../../domain/errors/index';

export interface JoinUserInput {
    socketId: string;
    name: string;
}

export class JoinUser {
    constructor(private userRepository: UserRepository) { }

    async execute(input: JoinUserInput): Promise<User> {
        if (!input.name?.trim()) {
            throw new ValidationError('User name is required');
        }

        if (!input.socketId) {
            throw new ValidationError('Socket ID is required');
        }

        const user = User.create(input.socketId, input.name);
        await this.userRepository.save(user);

        return user;
    }
}