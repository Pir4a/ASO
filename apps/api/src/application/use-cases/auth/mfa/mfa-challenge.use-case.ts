import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifySync } from 'otplib';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../../domain/repositories/user.repository.interface';
import {
    ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_BYTES,
    REFRESH_TOKEN_TTL_DAYS,
} from '../../../../infrastructure/services/auth.service';

export interface MfaChallengeResult {
    access_token: string;
    refresh_token: string;
    rememberMe: boolean;
    user: { id: string; email: string; role: string; mfaEnabled: boolean };
}

interface ChallengePayload {
    sub: string;
    purpose: string;
    rememberMe?: boolean;
}

/**
 * Second step of login when MFA is enabled. Verifies a TOTP code OR a
 * single-use backup code against the challenge JWT issued by the login
 * step. Backup codes are consumed (removed from the user's list).
 */
@Injectable()
export class MfaChallengeUseCase {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(challengeToken: string, code: string): Promise<MfaChallengeResult> {
        let payload: ChallengePayload;
        try {
            payload = this.jwtService.verify<ChallengePayload>(challengeToken);
        } catch {
            throw new UnauthorizedException('Challenge MFA expiré ou invalide.');
        }
        if (payload.purpose !== 'mfa-challenge' || !payload.sub) {
            throw new UnauthorizedException('Challenge MFA invalide.');
        }

        const user = await this.userRepository.findById(payload.sub);
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            throw new UnauthorizedException('MFA non configurée.');
        }

        const cleaned = code.replace(/\s+/g, '');
        if (!cleaned) throw new BadRequestException('Code requis.');

        // TOTP first (6 digits, the common path).
        const isTotp = /^\d{6}$/.test(cleaned);
        const totpOk =
            isTotp && verifySync({ token: cleaned, secret: user.mfaSecret });

        let usedBackupCode = false;
        if (!totpOk) {
            // Match against any of the bcrypt-hashed backup codes.
            const codes = user.mfaBackupCodes ?? [];
            let matchIndex = -1;
            for (let i = 0; i < codes.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                if (await bcrypt.compare(cleaned.toLowerCase(), codes[i])) {
                    matchIndex = i;
                    break;
                }
            }
            if (matchIndex < 0) {
                throw new UnauthorizedException('Code MFA incorrect.');
            }
            // Single-use: drop the matched code.
            user.mfaBackupCodes = codes.filter((_, i) => i !== matchIndex);
            usedBackupCode = true;
        }

        user.lastLoginAt = new Date();
        // #37 — issue a fresh refresh token alongside the MFA-cleared access
        // token. We mint+hash inline rather than calling AuthService to avoid
        // the cyclic IoC dependency (AuthService depends on this use case).
        const rawRefresh = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
        user.refreshTokenHash = await bcrypt.hash(rawRefresh, 10);
        user.refreshTokenExpiresAt = new Date(
            Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        );
        await this.userRepository.update(user);

        const accessPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            mfa: true,
            mfaEnabled: true,
        };
        const access_token = this.jwtService.sign(accessPayload, { expiresIn: ACCESS_TOKEN_TTL });

        return {
            access_token,
            refresh_token: rawRefresh,
            rememberMe: !!payload.rememberMe,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                mfaEnabled: user.mfaEnabled,
            },
            ...(usedBackupCode ? { backupCodeUsed: true } : {}),
        } as MfaChallengeResult;
    }
}
