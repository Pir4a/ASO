import { ContactMessage } from '../entities/contact-message.entity';

export interface ContactMessageRepository {
  create(message: ContactMessage): Promise<ContactMessage>;
  findAll(): Promise<ContactMessage[]>;
  findById(id: string): Promise<ContactMessage | null>;
  update(id: string, updates: Partial<ContactMessage>): Promise<ContactMessage | null>;
}

export const CONTACT_MESSAGE_REPOSITORY_TOKEN = 'ContactMessageRepository';
