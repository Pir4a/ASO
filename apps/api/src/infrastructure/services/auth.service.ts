import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthDto } from '../dto/auth/auth.dto';
import { FindUserByEmailUseCase } from '../../application/use-cases/users/find-user-by-email.use-case';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UserRole } from '../../domain/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) { }

  async register(authDto: AuthDto) {
    const { email, password } = authDto;

    const existingUser = await this.findUserByEmailUseCase.execute(email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.createUserUseCase.execute(email, passwordHash);

    // On ne retourne pas le hash du mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResult } = user;
    return userResult;
  }

  async login(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.findUserByEmailUseCase.execute(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

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
