import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RequestPasswordResetUseCase {
    private readonly logger = new Logger(RequestPasswordResetUseCase.name);

    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(EMAIL_GATEWAY)
        private readonly emailGateway: EmailGateway,
    ) { }

    async execute(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Anti-enumeration: silently succeed.
            return;
        }

        const token = randomBytes(32).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

        await this.userRepository.update(user);

        try {
            await this.emailGateway.sendPasswordResetEmail(email, token);
        } catch (e) {
            this.logger.error(`Failed to send password reset email to ${email}`, e as Error);
        }
    }
}
