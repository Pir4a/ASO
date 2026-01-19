import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { UsersModule } from './users.module';

import { NodemailerService } from '../services/email/nodemailer.service';
import { EMAIL_GATEWAY } from '../../domain/gateways/email.gateway';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case';

@Module({
  imports: [
    UsersModule,
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
    {
      provide: EMAIL_GATEWAY,
      useClass: NodemailerService,
    },
    VerifyEmailUseCase,
  ],
  exports: [AuthService],
})
export class AuthModule { }
