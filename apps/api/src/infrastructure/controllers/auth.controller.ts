import { Body, Controller, HttpCode, HttpStatus, Post, Patch, Param, Get, Query, Req, Res, Request, UnauthorizedException, UseGuards, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { AuthService, REFRESH_TOKEN_TTL_DAYS } from '../services/auth.service';
import { RegisterDto, LoginDto, UpdateUserRoleDto } from '../dto/auth/auth.dto';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto';
import { ResendVerificationDto } from '../dto/auth/resend-verification.dto';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../auth/roles.decorator';
import { ConfirmEmailChangeUseCase } from '../../application/use-cases/auth/confirm-email-change.use-case';
import { SetupMfaUseCase } from '../../application/use-cases/auth/mfa/setup-mfa.use-case';
import { VerifyMfaUseCase } from '../../application/use-cases/auth/mfa/verify-mfa.use-case';
import { DisableMfaUseCase } from '../../application/use-cases/auth/mfa/disable-mfa.use-case';
import { MfaChallengeUseCase } from '../../application/use-cases/auth/mfa/mfa-challenge.use-case';

class MfaCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;
}

class MfaChallengeDto {
  @IsString()
  @IsNotEmpty()
  challengeToken!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;
}

interface AuthedRequest {
  user?: { sub?: string };
}

const REFRESH_COOKIE_NAME = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly confirmEmailChangeUseCase: ConfirmEmailChangeUseCase,
    private readonly setupMfaUseCase: SetupMfaUseCase,
    private readonly verifyMfaUseCase: VerifyMfaUseCase,
    private readonly disableMfaUseCase: DisableMfaUseCase,
    private readonly mfaChallengeUseCase: MfaChallengeUseCase,
  ) { }

  /** Sets the httpOnly refresh cookie. `persistent` controls whether it
      survives a browser restart (rememberMe=true) or stays a session cookie. */
  private setRefreshCookie(res: ExpressResponse, raw: string, persistent: boolean) {
    res.cookie(REFRESH_COOKIE_NAME, raw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // Cookies must be readable on /auth/refresh and /auth/logout, both
      // mounted under /api/auth — but other routes don't need this cookie,
      // so scope it.
      path: '/api/auth',
      ...(persistent
        ? { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000 }
        : {}),
    });
  }

  private clearRefreshCookie(res: ExpressResponse) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(loginDto);
    // MFA-required short-circuit — no refresh cookie until the challenge
    // is cleared by the client.
    if ('mfaRequired' in result && result.mfaRequired) {
      return result;
    }
    this.setRefreshCookie(res, result.refresh_token, result.rememberMe);
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Patch('user/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.authService.updateUserRole(userId, updateUserRoleDto.role);
  }

  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.verifyEmail(token);
    // MFA path: no tokens issued; front-end will route to /login.
    if ('mfaRequired' in result && result.mfaRequired) {
      return { verified: true, mfaRequired: true, email: result.email };
    }
    // Reuse the same cookie helper as /login — same name, flags, scope.
    this.setRefreshCookie(res, result.refresh_token, result.rememberMe);
    return {
      verified: true,
      access_token: result.access_token,
      user: result.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      await this.authService.requestPasswordReset(dto.email);
    } catch (e) {
      // Anti-enumeration: never leak failures to the caller.
      this.logger.error('Password reset request failed', e as Error);
    }
    return { ok: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { ok: true };
  }

  @HttpCode(HttpStatus.OK)
  @Get('confirm-email-change')
  async confirmEmailChange(@Query('token') token: string) {
    return this.confirmEmailChangeUseCase.execute(token);
  }

  /** #7 — generate (or rotate) the TOTP secret + 8 backup codes. */
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async mfaSetup(@Request() req: AuthedRequest) {
    const userId = req.user?.sub;
    if (!userId) throw new Error('Unauthenticated.');
    return this.setupMfaUseCase.execute(userId);
  }

  /** #7 — confirm the authenticator can read TOTP, flips mfaEnabled=true. */
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async mfaVerify(@Request() req: AuthedRequest, @Body() body: MfaCodeDto) {
    const userId = req.user?.sub;
    if (!userId) throw new Error('Unauthenticated.');
    await this.verifyMfaUseCase.execute(userId, body.code);
    return { ok: true };
  }

  /** #7 — second login step when MFA is enabled (TOTP or backup code). */
  @Post('mfa/challenge')
  @HttpCode(HttpStatus.OK)
  async mfaChallenge(
    @Body() body: MfaChallengeDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.mfaChallengeUseCase.execute(body.challengeToken, body.code);
    this.setRefreshCookie(res, result.refresh_token, result.rememberMe);
    return {
      access_token: result.access_token,
      user: result.user,
      ...(('backupCodeUsed' in result && result.backupCodeUsed)
        ? { backupCodeUsed: true }
        : {}),
    };
  }

  /** #37 — exchange the httpOnly refresh cookie for a fresh 15m access token,
      rotating the cookie in the process. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    if (!raw) throw new UnauthorizedException('Refresh token manquant.');
    try {
      const result = await this.authService.refreshAccessToken(raw);
      // Rotation always renews maxAge — keeps "logged in" sliding for active users.
      this.setRefreshCookie(res, result.refresh_token, true);
      return { access_token: result.access_token, user: result.user };
    } catch (e) {
      this.clearRefreshCookie(res);
      throw e;
    }
  }

  /** #37 — best-effort revoke + cookie clear. Always returns 204 so a
      half-stale cookie doesn't surface a confusing error to the user. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CsrfGuard)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    if (raw) await this.authService.revokeRefreshTokenByRaw(raw);
    this.clearRefreshCookie(res);
  }

  /** #7 — disable MFA (requires a fresh TOTP code as proof of possession). */
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async mfaDisable(@Request() req: AuthedRequest, @Body() body: MfaCodeDto) {
    const userId = req.user?.sub;
    if (!userId) throw new Error('Unauthenticated.');
    await this.disableMfaUseCase.execute(userId, body.code);
    return { ok: true };
  }
}
