import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { generateSecret, generateURI } from 'otplib';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../../domain/repositories/user.repository.interface';

export interface MfaSetupResult {
    secret: string;
    otpauthUrl: string;
    qrDataUrl: string;
    /** 8 plain backup codes — shown to the user once. The DB only keeps the bcrypt hashes. */
    backupCodes: string[];
}

const ISSUER = 'Althea Systems';
const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_BYTES = 5; // 10 hex chars, easy to read in groups of 5.

function generateBackupCodes(): string[] {
    return Array.from({ length: BACKUP_CODE_COUNT }, () =>
        randomBytes(BACKUP_CODE_BYTES).toString('hex'),
    );
}

/**
 * Generates (or rotates) a TOTP secret + 8 fresh backup codes for the user.
 * Stores the secret + bcrypt-hashed codes on the User but DOES NOT flip
 * mfaEnabled — that happens after VerifyMfaUseCase confirms the authenticator
 * app is provisioned.
 */
@Injectable()
export class SetupMfaUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(userId: string): Promise<MfaSetupResult> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');
        if (user.mfaEnabled) {
            throw new BadRequestException('MFA déjà activée — désactivez-la avant de regénérer.');
        }

        const secret = await generateSecret();
        const otpauthUrl = generateURI({
            label: user.email,
            issuer: ISSUER,
            secret,
        });
        const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

        const codes = generateBackupCodes();
        const hashedCodes = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));

        user.mfaSecret = secret;
        user.mfaBackupCodes = hashedCodes;
        await this.userRepository.update(user);

        return { secret, otpauthUrl, qrDataUrl, backupCodes: codes };
    }
}
