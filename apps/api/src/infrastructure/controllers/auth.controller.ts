import { Body, Controller, HttpCode, HttpStatus, Post, Patch, Param, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, UpdateUserRoleDto } from '../dto/auth/auth.dto';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ConfirmEmailChangeUseCase } from '../../application/use-cases/auth/confirm-email-change.use-case';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly confirmEmailChangeUseCase: ConfirmEmailChangeUseCase,
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
}
