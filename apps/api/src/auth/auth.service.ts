import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(authDto: AuthDto) {
    const { email, password } = authDto;

    const existingUser = await this.usersRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({ email, passwordHash });
    await this.usersRepo.save(user);

    // On ne retourne pas le hash du mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResult } = user;
    return userResult;
  }

  async login(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role }, // Ajout de l'objet utilisateur
    };
  }
}
