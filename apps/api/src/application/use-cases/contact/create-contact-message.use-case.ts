import { Inject, Injectable } from '@nestjs/common';
import { CONTACT_MESSAGE_REPOSITORY_TOKEN } from '../../../domain/repositories/contact-message.repository.interface';
import type { ContactMessageRepository } from '../../../domain/repositories/contact-message.repository.interface';
import { ContactMessage } from '../../../domain/entities/contact-message.entity';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

@Injectable()
export class CreateContactMessageUseCase {
  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY_TOKEN)
    private readonly contactMessageRepository: ContactMessageRepository,
    @Inject(EMAIL_GATEWAY)
    private readonly emailGateway: EmailGateway
  ) { }

  async execute(payload: { name: string; email: string; subject?: string; message: string }) {
    const message = new ContactMessage({
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      status: 'new',
    });

    const savedMessage = await this.contactMessageRepository.create(message);

    // Send confirmation email to user
    try {
      await this.emailGateway.sendContactConfirmationEmail(payload.email, payload.name);
    } catch (error) {
      console.error('Failed to send contact confirmation email:', error);
      // Don't fail the request if email fails
    }

    return savedMessage;
  }
}
