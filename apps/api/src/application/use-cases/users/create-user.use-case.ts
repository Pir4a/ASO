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

    async execute(
        email: string,
        passwordHash: string,
        firstName?: string,
        lastName?: string,
        verificationToken?: string
    ): Promise<User> {
        const user = new User({
            email,
            passwordHash,
            firstName,
            lastName,
            isVerified: false,
            verificationToken,
            verificationTokenExpires: verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined // 24h
        });
        return this.userRepository.create(user);
    }
}
