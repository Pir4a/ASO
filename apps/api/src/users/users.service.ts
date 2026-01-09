import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findAll() {
    return this.repo.find({ select: ['id', 'email', 'role'] });
  }

  async findOneByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async create(email: string, passwordHash: string) {
    const user = this.repo.create({ email, passwordHash });
    return this.repo.save(user);
  }
}
