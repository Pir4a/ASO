import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class FindUserByIdUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }
}
