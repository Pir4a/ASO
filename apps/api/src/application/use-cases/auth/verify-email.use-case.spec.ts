import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  VerifyEmailUseCase,
  VERIFY_EMAIL_TOKEN_EXPIRED_CODE,
  VERIFY_EMAIL_TOKEN_INVALID_CODE,
} from './verify-email.use-case';
import { User } from '../../../domain/entities/user.entity';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

describe('VerifyEmailUseCase', () => {
  const userRepository: jest.Mocked<UserRepository> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByVerificationToken: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new VerifyEmailUseCase(userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws stable INVALID code when token not found', async () => {
    userRepository.findByVerificationToken.mockResolvedValue(null);

    await expect(useCase.execute('missing-token')).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute('missing-token')).rejects.toMatchObject({
      response: { message: VERIFY_EMAIL_TOKEN_INVALID_CODE },
    });
  });

  it('throws stable EXPIRED code when token is expired', async () => {
    const expiredUser = new User({
      id: 'u1',
      email: 'demo@althea.local',
      passwordHash: 'hash',
      role: 'customer',
      isVerified: false,
      isActive: true,
      verificationToken: 'expired',
      verificationTokenExpires: new Date(Date.now() - 60_000),
    });
    userRepository.findByVerificationToken.mockResolvedValue(expiredUser);

    await expect(useCase.execute('expired')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('expired')).rejects.toMatchObject({
      response: { message: VERIFY_EMAIL_TOKEN_EXPIRED_CODE },
    });
  });

  it('marks user as verified and clears token metadata', async () => {
    const user = new User({
      id: 'u2',
      email: 'demo@althea.local',
      passwordHash: 'hash',
      role: 'customer',
      isVerified: false,
      isActive: true,
      verificationToken: 'ok-token',
      verificationTokenExpires: new Date(Date.now() + 60_000),
    });
    userRepository.findByVerificationToken.mockResolvedValue(user);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    const result = await useCase.execute('ok-token');

    expect(result.isVerified).toBe(true);
    expect(result.verificationToken).toBeUndefined();
    expect(result.verificationTokenExpires).toBeUndefined();
    expect(userRepository.update.mock.calls).toHaveLength(1);
  });
});
