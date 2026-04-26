import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class ConfirmEmailChangeUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(token: string): Promise<{ ok: true; email: string }> {
        if (!token || typeof token !== 'string') {
            throw new BadRequestException('Token invalide.');
        }

        const user = await this.userRepository.findByPendingEmailToken(token);
        if (!user) {
            throw new BadRequestException('Token invalide ou expiré.');
        }
        if (
            !user.pendingEmailExpires ||
            user.pendingEmailExpires.getTime() < Date.now() ||
            !user.pendingEmail
        ) {
            user.pendingEmail = null;
            user.pendingEmailToken = null;
            user.pendingEmailExpires = null;
            await this.userRepository.update(user);
            throw new BadRequestException('Token invalide ou expiré.');
        }

        const taken = await this.userRepository.findByEmail(user.pendingEmail);
        if (taken && taken.id !== user.id) {
            user.pendingEmail = null;
            user.pendingEmailToken = null;
            user.pendingEmailExpires = null;
            await this.userRepository.update(user);
            throw new BadRequestException('Cet email est déjà utilisé.');
        }

        const newEmail = user.pendingEmail;
        user.email = newEmail;
        user.pendingEmail = null;
        user.pendingEmailToken = null;
        user.pendingEmailExpires = null;
        await this.userRepository.update(user);

        return { ok: true, email: newEmail };
    }
}
