import { ContactMessage } from '../entities/contact-message.entity';

export interface ContactMessageRepository {
  create(message: ContactMessage): Promise<ContactMessage>;
}

export const CONTACT_MESSAGE_REPOSITORY_TOKEN = 'ContactMessageRepository';
