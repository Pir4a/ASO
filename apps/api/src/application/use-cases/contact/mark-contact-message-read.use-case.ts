import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../../../infrastructure/persistence/typeorm/entities/contact-message.entity';

@Injectable()
export class MarkContactMessageReadUseCase {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  // CDC XVI.1 — admin opens a message → we flip the flag so the sidebar badge
  // drops. We still return the row for the BO to reconcile its local state.
  async execute(id: string): Promise<ContactMessage> {
    const message = await this.repo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException('Contact message not found');
    }
    if (!message.isRead) {
      message.isRead = true;
      await this.repo.save(message);
    }
    return message;
  }
}
