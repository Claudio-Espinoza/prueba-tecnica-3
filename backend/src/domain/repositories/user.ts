import { User } from '../entities/user';

export interface UserRepository {
    save(user: User): Promise<void>;
    findBySocketId(socketId: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    deleteBySocketId(socketId: string): Promise<void>;
}