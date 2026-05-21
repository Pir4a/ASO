import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

@Injectable()
export class ResendVerificationEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
    @Inject(EMAIL_GATEWAY)
    private readonly emailGateway: EmailGateway,
  ) {}

  /** Always resolves ok — avoids email enumeration. */
  async execute(email: string): Promise<{ ok: true }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { ok: true };

    const user = await this.userRepository.findByEmail(normalized);
    if (!user || user.isVerified) return { ok: true };

    const verificationToken = randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userRepository.update(user);

    try {
      await this.emailGateway.sendVerificationEmail(normalized, verificationToken, user.preferredLocale ?? undefined);
    } catch (e) {
      console.error('Failed to resend verification email:', e);
    }

    return { ok: true };
  }
}
