import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(email: string, passwordHash: string): Promise<User> {
        const user = new User({ email, passwordHash });
        // Note: ID generation should probably happen here or in repo.
        // Repo usually generates it if DB handles it (uuid v4).
        // TypeORM repo handles this via PrimaryGeneratedColumn.
        return this.userRepository.create(user);
    }
}
