import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { verifySync } from 'otplib';
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../../domain/repositories/user.repository.interface';

/**
 * Requires a fresh TOTP code as proof-of-possession before tearing MFA down.
 */
@Injectable()
export class DisableMfaUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(userId: string, code: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');
        if (!user.mfaEnabled || !user.mfaSecret) {
            throw new BadRequestException('MFA non active sur ce compte.');
        }
        const ok = verifySync({
            token: code.replace(/\s+/g, ''),
            secret: user.mfaSecret,
        });
        if (!ok) throw new BadRequestException('Code TOTP invalide.');
        user.mfaEnabled = false;
        user.mfaSecret = null;
        user.mfaBackupCodes = null;
        await this.userRepository.update(user);
    }
}
