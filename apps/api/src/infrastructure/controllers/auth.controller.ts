import { Body, Controller, HttpCode, HttpStatus, Post, Patch, Param, Get, Query, Request, UseGuards, Logger } from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, UpdateUserRoleDto } from '../dto/auth/auth.dto';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
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

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
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
  async mfaChallenge(@Body() body: MfaChallengeDto) {
    return this.mfaChallengeUseCase.execute(body.challengeToken, body.code);
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
