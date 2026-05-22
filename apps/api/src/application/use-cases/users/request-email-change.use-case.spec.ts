import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestEmailChangeUseCase } from './request-email-change.use-case';
import { User } from '../../../domain/entities/user.entity';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

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

function buildEmailGateway(): jest.Mocked<EmailGateway> {
  return {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendInvoiceEmail: jest.fn(),
    sendEmailChangeConfirmation: jest.fn(),
    sendOrderConfirmation: jest.fn(),
    sendCreditNoteEmail: jest.fn(),
    sendGuestSignupEmail: jest.fn(),
    sendChatReply: jest.fn(),
    sendStockNotifyConfirmationEmail: jest.fn(),
    sendProductBackInStockEmail: jest.fn(),
  };
}

describe('RequestEmailChangeUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let emailGateway: jest.Mocked<EmailGateway>;
  let useCase: RequestEmailChangeUseCase;

  const baseUser = () =>
    new User({
      id: 'u1',
      email: 'old@althea.local',
      passwordHash: 'h',
      role: 'customer',
      isVerified: true,
      isActive: true,
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpires: null,
      preferredLocale: 'fr',
    });

  beforeEach(() => {
    userRepository = buildUserRepo();
    emailGateway = buildEmailGateway();
    useCase = new RequestEmailChangeUseCase(userRepository, emailGateway);
  });

  it('rejects a malformed email', async () => {
    await expect(useCase.execute('u1', 'not-an-email')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('u1', 'new@althea.local')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects when the requested email equals the current one (case-insensitive)', async () => {
    userRepository.findById.mockResolvedValue(baseUser());
    await expect(useCase.execute('u1', 'OLD@althea.local')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects when another user already owns the email', async () => {
    userRepository.findById.mockResolvedValue(baseUser());
    userRepository.findByEmail.mockResolvedValue(
      new User({
        id: 'u2',
        email: 'new@althea.local',
        passwordHash: 'h',
        role: 'customer',
        isVerified: true,
        isActive: true,
      }),
    );
    await expect(useCase.execute('u1', 'new@althea.local')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('stores pendingEmail + 32-byte token + 24h expiry, sends confirmation', async () => {
    const user = baseUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    const result = await useCase.execute('u1', '  NEW@althea.local  ');

    expect(result).toEqual({ pendingEmail: 'new@althea.local' });
    expect(user.pendingEmail).toBe('new@althea.local');
    expect(user.pendingEmailToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.pendingEmailExpires!.getTime()).toBeGreaterThan(Date.now());
    expect(emailGateway.sendEmailChangeConfirmation).toHaveBeenCalledWith(
      'new@althea.local',
      user.pendingEmailToken,
      'fr',
    );
  });
});
