import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { verifySync } from 'otplib';
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../../domain/repositories/user.repository.interface';

/**
 * Confirms the user can read TOTP codes from the freshly provisioned
 * authenticator. Flips mfaEnabled to true on success.
 */
@Injectable()
export class VerifyMfaUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(userId: string, code: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');
        if (!user.mfaSecret) {
            throw new BadRequestException("Aucune configuration MFA en attente. Lancez d'abord le setup.");
        }
        if (user.mfaEnabled) return; // idempotent
        const ok = verifySync({
            token: code.replace(/\s+/g, ''),
            secret: user.mfaSecret,
        });
        if (!ok) throw new BadRequestException('Code TOTP invalide.');
        user.mfaEnabled = true;
        await this.userRepository.update(user);
    }
}
