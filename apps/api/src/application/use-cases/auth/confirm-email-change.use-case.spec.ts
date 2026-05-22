import { BadRequestException } from '@nestjs/common';
import { ConfirmEmailChangeUseCase } from './confirm-email-change.use-case';
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

function buildUser(partial: Partial<User>): User {
  return new User({
    id: 'u1',
    email: 'old@althea.local',
    passwordHash: 'h',
    role: 'customer',
    isVerified: true,
    isActive: true,
    pendingEmail: null,
    pendingEmailToken: null,
    pendingEmailExpires: null,
    ...partial,
  });
}

describe('ConfirmEmailChangeUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ConfirmEmailChangeUseCase;

  beforeEach(() => {
    userRepository = buildUserRepo();
    useCase = new ConfirmEmailChangeUseCase(userRepository);
  });

  it('rejects when token is empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow(BadRequestException);
  });

  it('rejects when token does not match any user', async () => {
    userRepository.findByPendingEmailToken.mockResolvedValue(null);
    await expect(useCase.execute('nope')).rejects.toThrow(BadRequestException);
  });

  it('clears stale pending fields and rejects when token is expired', async () => {
    const user = buildUser({
      pendingEmail: 'new@althea.local',
      pendingEmailToken: 't',
      pendingEmailExpires: new Date(Date.now() - 60_000),
    });
    userRepository.findByPendingEmailToken.mockResolvedValue(user);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    await expect(useCase.execute('t')).rejects.toThrow(BadRequestException);
    expect(user.pendingEmail).toBeNull();
    expect(user.pendingEmailToken).toBeNull();
    expect(user.pendingEmailExpires).toBeNull();
    expect(userRepository.update).toHaveBeenCalledTimes(1);
  });

  it('rejects + clears pending fields when the target email was taken by another user in the meantime', async () => {
    const user = buildUser({
      id: 'u1',
      pendingEmail: 'new@althea.local',
      pendingEmailToken: 't',
      pendingEmailExpires: new Date(Date.now() + 60_000),
    });
    userRepository.findByPendingEmailToken.mockResolvedValue(user);
    userRepository.findByEmail.mockResolvedValue(
      buildUser({ id: 'u2', email: 'new@althea.local' }),
    );
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    await expect(useCase.execute('t')).rejects.toThrow(BadRequestException);
    expect(user.email).toBe('old@althea.local');
    expect(user.pendingEmail).toBeNull();
  });

  it('swaps the email and returns ok on success', async () => {
    const user = buildUser({
      id: 'u1',
      email: 'old@althea.local',
      pendingEmail: 'new@althea.local',
      pendingEmailToken: 't',
      pendingEmailExpires: new Date(Date.now() + 60_000),
    });
    userRepository.findByPendingEmailToken.mockResolvedValue(user);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    const result = await useCase.execute('t');

    expect(result).toEqual({ ok: true, email: 'new@althea.local' });
    expect(user.email).toBe('new@althea.local');
    expect(user.pendingEmail).toBeNull();
    expect(user.pendingEmailToken).toBeNull();
    expect(user.pendingEmailExpires).toBeNull();
  });

  it('treats a user with the same id as not "taken" (idempotent re-use of own token)', async () => {
    const user = buildUser({
      id: 'u1',
      email: 'old@althea.local',
      pendingEmail: 'new@althea.local',
      pendingEmailToken: 't',
      pendingEmailExpires: new Date(Date.now() + 60_000),
    });
    userRepository.findByPendingEmailToken.mockResolvedValue(user);
    userRepository.findByEmail.mockResolvedValue(user); // same id
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    const result = await useCase.execute('t');
    expect(result.email).toBe('new@althea.local');
  });
});
