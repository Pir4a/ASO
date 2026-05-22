import { DeleteUserUseCase } from './delete-user.use-case';
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

describe('DeleteUserUseCase', () => {
  it('delegates deletion to the repository (CDC §XVI.10 — GDPR right to erasure)', async () => {
    const userRepository = buildUserRepo();
    userRepository.delete.mockResolvedValue(undefined);
    const useCase = new DeleteUserUseCase(userRepository);

    await useCase.execute('user-id-42');

    expect(userRepository.delete).toHaveBeenCalledWith('user-id-42');
    expect(userRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('propagates repository errors to the caller', async () => {
    const userRepository = buildUserRepo();
    userRepository.delete.mockRejectedValue(new Error('FK violation'));
    const useCase = new DeleteUserUseCase(userRepository);

    await expect(useCase.execute('user-id-42')).rejects.toThrow('FK violation');
  });
});
