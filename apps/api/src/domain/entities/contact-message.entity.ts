export type ContactMessageStatus = 'new' | 'processed';

export class ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ContactMessage>) {
    Object.assign(this, partial);
  }
}
