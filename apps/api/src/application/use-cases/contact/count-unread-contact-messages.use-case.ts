import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../../../infrastructure/persistence/typeorm/entities/contact-message.entity';

@Injectable()
export class CountUnreadContactMessagesUseCase {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  // Lightweight count used by the BO sidebar badge — cheap COUNT on an
  // indexed boolean column, so we don't need to paginate the full list.
  async execute(): Promise<{ unread: number }> {
    const unread = await this.repo.count({ where: { isRead: false } });
    return { unread };
  }
}
