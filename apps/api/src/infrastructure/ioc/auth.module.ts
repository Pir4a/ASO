import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    UsersModule,
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
    RolesGuard,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtStrategy, PassportModule, EMAIL_GATEWAY],
})
export class AuthModule { }

