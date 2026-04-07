import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../../../infrastructure/persistence/typeorm/entities/contact-message.entity';

type CreateContactMessageInput = {
  subject: string;
  email: string;
  message: string;
};

@Injectable()
export class CreateContactMessageUseCase {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  async execute(input: CreateContactMessageInput) {
    const entity = this.repo.create({
      subject: input.subject.trim(),
      email: input.email.trim().toLowerCase(),
      message: input.message.trim(),
    });
    return this.repo.save(entity);
  }
}
