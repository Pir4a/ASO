import { ResendVerificationEmailUseCase } from './resend-verification-email.use-case';
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

describe('ResendVerificationEmailUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let emailGateway: jest.Mocked<EmailGateway>;
  let useCase: ResendVerificationEmailUseCase;

  beforeEach(() => {
    userRepository = buildUserRepo();
    emailGateway = buildEmailGateway();
    useCase = new ResendVerificationEmailUseCase(userRepository, emailGateway);
  });

  it('returns ok and does nothing for an empty email', async () => {
    await expect(useCase.execute('')).resolves.toEqual({ ok: true });
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('returns ok without leaking that a user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute('ghost@althea.local')).resolves.toEqual({ ok: true });
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(emailGateway.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns ok without re-sending when the user is already verified', async () => {
    const user = new User({
      id: 'u',
      email: 'demo@althea.local',
      passwordHash: 'h',
      role: 'customer',
      isVerified: true,
      isActive: true,
    });
    userRepository.findByEmail.mockResolvedValue(user);
    await expect(useCase.execute('demo@althea.local')).resolves.toEqual({ ok: true });
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(emailGateway.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('rotates the verification token + 24h expiry then sends the email', async () => {
    const user = new User({
      id: 'u',
      email: 'demo@althea.local',
      passwordHash: 'h',
      role: 'customer',
      isVerified: false,
      isActive: true,
      verificationToken: 'old',
      verificationTokenExpires: new Date(Date.now() - 1000),
      preferredLocale: 'en',
    });
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.update.mockImplementation((u) => Promise.resolve(u));

    await useCase.execute('Demo@Althea.Local'); // also tests trim+lowercase

    expect(userRepository.findByEmail).toHaveBeenCalledWith('demo@althea.local');
    expect(user.verificationToken).not.toBe('old');
    expect(user.verificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.verificationTokenExpires!.getTime()).toBeGreaterThan(Date.now());
    expect(emailGateway.sendVerificationEmail).toHaveBeenCalledWith(
      'demo@althea.local',
      user.verificationToken,
      'en',
    );
  });
});
