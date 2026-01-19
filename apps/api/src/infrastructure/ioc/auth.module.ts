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
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case';

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
    VerifyEmailUseCase,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }

