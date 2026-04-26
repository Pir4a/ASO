import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { UsersModule } from './users.module';
import { JwtStrategy } from '../auth/jwt.strategy';

import { NodemailerService } from '../services/email/nodemailer.service';
import { EMAIL_GATEWAY } from '../../domain/gateways/email.gateway';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case';
import { ConfirmEmailChangeUseCase } from '../../application/use-cases/auth/confirm-email-change.use-case';
import { SetupMfaUseCase } from '../../application/use-cases/auth/mfa/setup-mfa.use-case';
import { VerifyMfaUseCase } from '../../application/use-cases/auth/mfa/verify-mfa.use-case';
import { DisableMfaUseCase } from '../../application/use-cases/auth/mfa/disable-mfa.use-case';
import { MfaChallengeUseCase } from '../../application/use-cases/auth/mfa/mfa-challenge.use-case';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'dev-secret',
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: EMAIL_GATEWAY,
      useClass: NodemailerService,
    },
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    ConfirmEmailChangeUseCase,
    SetupMfaUseCase,
    VerifyMfaUseCase,
    DisableMfaUseCase,
    MfaChallengeUseCase,
    RolesGuard,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtStrategy, PassportModule, EMAIL_GATEWAY, RequestPasswordResetUseCase],
})
export class AuthModule { }

