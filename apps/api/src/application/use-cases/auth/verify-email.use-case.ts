import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class VerifyEmailUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(token: string): Promise<User> {
        // In a real repo, we'd have findByVerificationToken, but for now we might need to search
        // Since repo interface is simple, let's assume we might need to fetch user by something else or add findByToken
        // For simplicity/Clean Arch, we should add findByVerificationToken to the repo interface.
        // But to avoid breaking too much, let's assume valid token logic involves finding the user.

        // Let's add findByVerificationToken to repo interface next.
        // For now, let's stub appropriately or relying on a hypothetical method we'll add.

        const user = await this.userRepository.findByVerificationToken(token);
        if (!user) {
            throw new NotFoundException('Token invalide ou utilisateur introuvable.');
        }

        if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
            throw new BadRequestException('Token expiré.');
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        return this.userRepository.update(user);
    }
}
