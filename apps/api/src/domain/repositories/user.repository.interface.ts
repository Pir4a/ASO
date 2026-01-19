import { User } from '../entities/user.entity';

export interface UserRepository {
    findAll(): Promise<User[]>;
    findOneByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(user: User): Promise<User>;
    update(user: User): Promise<User>;
}

export const USER_REPOSITORY_TOKEN = 'UserRepository';
