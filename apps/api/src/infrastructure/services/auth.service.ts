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
import { UserRole } from '../../domain/entities/user.entity';

import { EMAIL_GATEWAY } from '../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../domain/gateways/email.gateway';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(EMAIL_GATEWAY) private readonly emailGateway: EmailGateway,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
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
      verificationToken
    );

    try {
      await this.emailGateway.sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResult } = user;
    return userResult;
  }

  async verifyEmail(token: string) {
    return this.verifyEmailUseCase.execute(token);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.findUserByEmailUseCase.execute(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter.');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Ce compte a été désactivé par un administrateur.');
    }

    user.lastLoginAt = new Date();
    await this.updateUserUseCase.execute(user);

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
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
