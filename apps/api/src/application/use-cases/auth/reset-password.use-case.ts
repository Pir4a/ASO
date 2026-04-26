import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(token: string, newPassword: string): Promise<void> {
        if (!token || typeof token !== 'string') {
            throw new BadRequestException('Token invalide.');
        }

        const user = await this.userRepository.findByPasswordResetToken(token);
        if (!user) {
            throw new BadRequestException('Token invalide ou expiré.');
        }

        if (
            !user.passwordResetTokenExpires ||
            user.passwordResetTokenExpires.getTime() < Date.now()
        ) {
            throw new BadRequestException('Token invalide ou expiré.');
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = null;
        user.passwordResetTokenExpires = null;

        await this.userRepository.update(user);
    }
}
