import { User } from '../entities/user.entity';

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';

export interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByVerificationToken(token: string): Promise<User | null>;
    create(user: User): Promise<User>;
    update(user: User): Promise<User>;
}
