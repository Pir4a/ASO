import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../../../infrastructure/persistence/typeorm/entities/contact-message.entity';

@Injectable()
export class GetContactMessagesUseCase {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  async execute() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }
}
