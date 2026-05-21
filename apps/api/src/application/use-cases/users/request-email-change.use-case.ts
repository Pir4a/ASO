import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

const PENDING_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class RequestEmailChangeUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(EMAIL_GATEWAY)
        private readonly emailGateway: EmailGateway,
    ) { }

    async execute(userId: string, newEmail: string): Promise<{ pendingEmail: string }> {
        const trimmed = newEmail.trim().toLowerCase();
        if (!EMAIL_RE.test(trimmed)) {
            throw new BadRequestException('Email invalide.');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('Utilisateur introuvable.');

        if (trimmed === user.email) {
            throw new BadRequestException("L'email demandé est déjà votre adresse actuelle.");
        }

        const taken = await this.userRepository.findByEmail(trimmed);
        if (taken && taken.id !== user.id) {
            throw new BadRequestException('Cet email est déjà utilisé.');
        }

        user.pendingEmail = trimmed;
        user.pendingEmailToken = randomBytes(32).toString('hex');
        user.pendingEmailExpires = new Date(Date.now() + PENDING_TOKEN_TTL_MS);

        await this.userRepository.update(user);
        await this.emailGateway.sendEmailChangeConfirmation(trimmed, user.pendingEmailToken, user.preferredLocale ?? undefined);

        return { pendingEmail: trimmed };
    }
}
