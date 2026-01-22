import { Inject, Injectable } from '@nestjs/common';
import { CONTACT_MESSAGE_REPOSITORY_TOKEN } from '../../../domain/repositories/contact-message.repository.interface';
import type { ContactMessageRepository } from '../../../domain/repositories/contact-message.repository.interface';
import { ContactMessage } from '../../../domain/entities/contact-message.entity';

@Injectable()
export class CreateContactMessageUseCase {
  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY_TOKEN)
    private readonly contactMessageRepository: ContactMessageRepository
  ) { }

  async execute(payload: { name: string; email: string; message: string }) {
    const message = new ContactMessage({
      name: payload.name,
      email: payload.email,
      message: payload.message,
      status: 'new',
    });

    return this.contactMessageRepository.create(message);
  }
}
