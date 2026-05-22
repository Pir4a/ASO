import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from '../dto/auth/auth.dto';
import { FindUserByEmailUseCase } from '../../application/use-cases/users/find-user-by-email.use-case';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import {
  USER_REPOSITORY_TOKEN,
  type UserRepository,
} from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/entities/user.entity';

import { EMAIL_GATEWAY } from '../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../domain/gateways/email.gateway';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case';
import { ResendVerificationEmailUseCase } from '../../application/use-cases/auth/resend-verification-email.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case';
import { randomBytes } from 'crypto';

export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED';

/** #37 — short-lived access token, refresh cookie carries the long-lived bit. */
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: UserRepository,
    @Inject(EMAIL_GATEWAY) private readonly emailGateway: EmailGateway,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationEmailUseCase: ResendVerificationEmailUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.findUserByEmailUseCase.execute(email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.createUserUseCase.execute(
      email,
      passwordHash,
      firstName,
      lastName,
      verificationToken,
      new Date(),
    );

    try {
      await this.emailGateway.sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResult } = user;
    return {
      ...userResult,
      message:
        'Compte créé. Un email de vérification a été envoyé — cliquez sur le lien pour activer votre compte.',
      email,
    };
  }

  async resendVerificationEmail(email: string) {
    return this.resendVerificationEmailUseCase.execute(email);
  }

  /** Verifies the email-confirmation token and, on success, either auto-signs
      the user in (issuing access + refresh tokens like /login does) or — when
      MFA is enabled on the account — short-circuits with `{ mfaRequired }` so
      the front-end can route the user to /login for the second factor. We do
      NOT bypass MFA: a verified-but-MFA-enabled user must still post their
      TOTP to /auth/mfa/challenge (here we just hand them back to /login). */
  async verifyEmail(token: string) {
    const user = await this.verifyEmailUseCase.execute(token);

    if (user.isActive === false) {
      // Same shape as resend-verification so the UI can disambiguate from
      // "bad token". We don't expose this on the verify path normally, but
      // an admin could have disabled the account between signup and click.
      throw new UnauthorizedException('Ce compte a été désactivé par un administrateur.');
    }

    if (user.mfaEnabled) {
      // No tokens minted — front-end will route to /login?email=<email> so the
      // user re-enters their password and clears the MFA challenge there.
      return {
        verified: true as const,
        mfaRequired: true as const,
        email: user.email,
      };
    }

    user.lastLoginAt = new Date();
    const refresh_token = await this.rotateRefreshToken(user);
    await this.updateUserUseCase.execute(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      mfa: false,
      mfaEnabled: false,
      locale: user.preferredLocale ?? undefined,
    };
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });

    return {
      verified: true as const,
      access_token,
      refresh_token,
      // Auto-login after verification keeps the session for the lifetime of
      // the refresh cookie's default — treat it as a non-rememberMe session.
      rememberMe: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: false,
      },
      locale: user.preferredLocale ?? undefined,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, rememberMe } = loginDto;
    const user = await this.findUserByEmailUseCase.execute(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException({
        message: 'Veuillez vérifier votre email avant de vous connecter.',
        code: EMAIL_NOT_VERIFIED_CODE,
      });
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Ce compte a été désactivé par un administrateur.');
    }

    // MFA gate: don't issue an access token yet — the client has to post the
    // TOTP / backup code to /auth/mfa/challenge. The challengeToken is a short-
    // lived JWT (5 min) carrying the user id and the rememberMe preference.
    if (user.mfaEnabled) {
      const challengeToken = this.jwtService.sign(
        { sub: user.id, purpose: 'mfa-challenge', rememberMe: !!rememberMe },
        { expiresIn: '5m' },
      );
      return { mfaRequired: true as const, challengeToken };
    }

    user.lastLoginAt = new Date();
    const refresh_token = await this.rotateRefreshToken(user);
    await this.updateUserUseCase.execute(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      mfa: false,
      mfaEnabled: false,
      locale: user.preferredLocale ?? undefined,
    };
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });

    return {
      access_token,
      refresh_token,
      rememberMe: !!rememberMe,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: false,
      },
      locale: user.preferredLocale ?? undefined,
    };
  }

  /** Mints a fresh refresh token, persists its bcrypt hash + expiry on the
      user, and returns the raw token so the controller can put it in a
      Set-Cookie header. The caller is responsible for `updateUserUseCase`. */
  async rotateRefreshToken(user: { id: string; refreshTokenHash: string | null; refreshTokenExpiresAt: Date | null }): Promise<string> {
    const raw = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    user.refreshTokenHash = await bcrypt.hash(raw, 10);
    user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    return raw;
  }

  /** Validates a raw refresh token from the cookie, rotates it, and issues a
      fresh access token. Throws UnauthorizedException for any failure path so
      the controller can blanket-catch and clear the cookie. */
  async refreshAccessToken(rawRefresh: string) {
    if (!rawRefresh) throw new UnauthorizedException('Refresh token manquant.');
    // Single-slot rotation — we have no embedded user id, so we have to scan.
    // For the school project's scale this is fine; a real impl would split
    // refresh into `<userId>.<secret>` to make lookup O(1).
    const matches = await this.findUserByRawRefreshToken(rawRefresh);
    if (!matches) throw new UnauthorizedException('Refresh token invalide.');
    const { user } = matches;
    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now()) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await this.updateUserUseCase.execute(user);
      throw new UnauthorizedException('Refresh token expiré.');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Compte désactivé.');
    }
    const newRefresh = await this.rotateRefreshToken(user);
    await this.updateUserUseCase.execute(user);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      // Carry the prior session's MFA verdict — refreshing must not silently
      // upgrade a non-MFA-cleared session.
      mfa: false,
      mfaEnabled: user.mfaEnabled === true,
      locale: user.preferredLocale ?? undefined,
    };
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
    return {
      access_token,
      refresh_token: newRefresh,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: user.mfaEnabled === true,
      },
    };
  }

  async revokeRefreshTokenByRaw(rawRefresh: string): Promise<void> {
    if (!rawRefresh) return;
    const matches = await this.findUserByRawRefreshToken(rawRefresh);
    if (!matches) return;
    const { user } = matches;
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.updateUserUseCase.execute(user);
  }

  /** Walks every user with a stored refresh hash and bcrypt-compares.
      O(n) on the user table; fine for school-project scale. */
  private async findUserByRawRefreshToken(rawRefresh: string) {
    const candidates = await this.findUsersWithRefreshHash();
    for (const u of candidates) {
      if (!u.refreshTokenHash) continue;
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(rawRefresh, u.refreshTokenHash)) {
        return { user: u };
      }
    }
    return null;
  }

  private async findUsersWithRefreshHash() {
    return (await this.userRepository.findAll()).filter((u) => !!u.refreshTokenHash);
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.requestPasswordResetUseCase.execute(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.resetPasswordUseCase.execute(token, newPassword);
  }

  async updateUserRole(userId: string, newRole: string) {
    const user = await this.findUserByIdUseCase.execute(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    user.role = newRole as UserRole;
    await this.updateUserUseCase.execute(user);

    return { id: user.id, email: user.email, role: user.role };
  }
}
