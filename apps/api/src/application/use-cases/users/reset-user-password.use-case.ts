import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { randomBytes } from 'crypto';

@Injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) { }

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    const tempPassword = randomBytes(6).toString('hex');
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.userRepository.update(user);

    return { userId: user.id, tempPassword };
  }
}
