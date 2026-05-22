import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
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

describe('RequestPasswordResetUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let emailGateway: jest.Mocked<EmailGateway>;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    userRepository = buildUserRepo();
    emailGateway = buildEmailGateway();
    useCase = new RequestPasswordResetUseCase(userRepository, emailGateway);
  });

  it('silently succeeds without sending email when user does not exist (anti-enumeration)', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute('unknown@althea.local')).resolves.toBeUndefined();
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(emailGateway.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('writes a 32-byte hex reset token + 24h expiry, then sends the email', async () => {
    const user = new User({
      id: 'u1',
      email: 'demo@althea.local',
      passwordHash: 'hash',
      role: 'customer',
      isVerified: true,
      isActive: true,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      preferredLocale: 'fr',
    });
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    const before = Date.now();
    await useCase.execute('demo@althea.local');
    const after = Date.now();

    expect(user.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetTokenExpires).toBeInstanceOf(Date);
    const expMs = user.passwordResetTokenExpires!.getTime();
    expect(expMs).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000 - 1000);
    expect(expMs).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000);
    expect(userRepository.update).toHaveBeenCalledWith(user);
    expect(emailGateway.sendPasswordResetEmail).toHaveBeenCalledWith(
      'demo@althea.local',
      user.passwordResetToken,
      'fr',
    );
  });

  it('still persists the token even if the email gateway throws', async () => {
    const user = new User({
      id: 'u2',
      email: 'demo@althea.local',
      passwordHash: 'hash',
      role: 'customer',
      isVerified: true,
      isActive: true,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      preferredLocale: null,
    });
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));
    emailGateway.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(useCase.execute('demo@althea.local')).resolves.toBeUndefined();
    expect(userRepository.update).toHaveBeenCalledTimes(1);
    expect(user.passwordResetToken).toBeTruthy();
  });
});
