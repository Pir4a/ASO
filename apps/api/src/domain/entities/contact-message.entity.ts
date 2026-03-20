export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

export class ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: ContactMessageStatus;
  adminReply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ContactMessage>) {
    Object.assign(this, partial);
  }
}
