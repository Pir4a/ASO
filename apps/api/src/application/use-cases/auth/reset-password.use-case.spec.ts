import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { User } from '../../../domain/entities/user.entity';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

function buildUserRepo(): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByVerificationToken: jest.fn(),
    findByPasswordResetToken: jest.fn(),
    findByPendingEmailToken: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('ResetPasswordUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    userRepository = buildUserRepo();
    useCase = new ResetPasswordUseCase(userRepository);
  });

  it('rejects an empty token', async () => {
    await expect(useCase.execute('', 'NewStrongPass1!')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects when no user matches the token', async () => {
    userRepository.findByPasswordResetToken.mockResolvedValue(null);
    await expect(useCase.execute('bad-token', 'NewStrongPass1!')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects when the token expiry is in the past', async () => {
    const user = new User({
      id: 'u1',
      email: 'demo@althea.local',
      passwordHash: 'old',
      role: 'customer',
      isVerified: true,
      isActive: true,
      passwordResetToken: 't',
      passwordResetTokenExpires: new Date(Date.now() - 60_000),
    });
    userRepository.findByPasswordResetToken.mockResolvedValue(user);

    await expect(useCase.execute('t', 'NewStrongPass1!')).rejects.toThrow(
      BadRequestException,
    );
    // Do not silently clear an expired token — caller must request a new one.
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('hashes the new password and clears reset-token metadata on success', async () => {
    const user = new User({
      id: 'u2',
      email: 'demo@althea.local',
      passwordHash: 'old',
      role: 'customer',
      isVerified: true,
      isActive: true,
      passwordResetToken: 'valid-token',
      passwordResetTokenExpires: new Date(Date.now() + 60_000),
    });
    userRepository.findByPasswordResetToken.mockResolvedValue(user);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    await useCase.execute('valid-token', 'NewStrongPass1!');

    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetTokenExpires).toBeNull();
    expect(user.passwordHash).not.toBe('old');
    expect(await bcrypt.compare('NewStrongPass1!', user.passwordHash)).toBe(true);
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });
});
