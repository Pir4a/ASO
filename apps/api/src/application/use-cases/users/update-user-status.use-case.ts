import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) { }

  async execute(userId: string, isActive: boolean) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    user.isActive = isActive;
    return this.userRepository.update(user);
  }
}
