import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

export const VERIFY_EMAIL_TOKEN_EXPIRED_CODE = 'VERIFY_EMAIL_TOKEN_EXPIRED';
export const VERIFY_EMAIL_TOKEN_INVALID_CODE = 'VERIFY_EMAIL_TOKEN_INVALID';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<User> {
    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) {
      // Stable code in `code`, human message in `message` — front-end can match
      // on the code while logs / fallback UI still get a readable string.
      throw new NotFoundException({
        message: 'Token invalide ou utilisateur introuvable.',
        code: VERIFY_EMAIL_TOKEN_INVALID_CODE,
      });
    }

    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < new Date()
    ) {
      throw new BadRequestException({
        message: 'Token expiré.',
        code: VERIFY_EMAIL_TOKEN_EXPIRED_CODE,
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    return this.userRepository.update(user);
  }
}
