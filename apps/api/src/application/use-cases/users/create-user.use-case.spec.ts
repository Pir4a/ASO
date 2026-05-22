import { CreateUserUseCase } from './create-user.use-case';
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

describe('CreateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = buildUserRepo();
    useCase = new CreateUserUseCase(userRepository);
    userRepository.create.mockImplementation((u) => Promise.resolve(u));
  });

  it('persists email + password hash + name + verification token', async () => {
    const created = await useCase.execute(
      'demo@althea.local',
      'hashed-pw',
      'Demo',
      'User',
      'verif-token',
    );

    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(created.email).toBe('demo@althea.local');
    expect(created.passwordHash).toBe('hashed-pw');
    expect(created.firstName).toBe('Demo');
    expect(created.lastName).toBe('User');
    expect(created.verificationToken).toBe('verif-token');
    expect(created.isVerified).toBe(false);
  });

  it('sets a 24h verification expiry when a token is supplied', async () => {
    const before = Date.now();
    const created = await useCase.execute('a@b.c', 'h', undefined, undefined, 't');
    const after = Date.now();
    const exp = created.verificationTokenExpires!.getTime();
    expect(exp).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000 - 1000);
    expect(exp).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000);
  });

  it('leaves verification expiry undefined when no token is supplied', async () => {
    const created = await useCase.execute('a@b.c', 'h');
    expect(created.verificationToken).toBeUndefined();
    expect(created.verificationTokenExpires).toBeUndefined();
  });

  it('persists CDC §XI termsAcceptedAt when provided', async () => {
    const ts = new Date('2026-05-22T10:00:00Z');
    const created = await useCase.execute('a@b.c', 'h', 'A', 'B', 't', ts);
    expect(created.termsAcceptedAt).toBe(ts);
  });
});
