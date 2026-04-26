export type ChatSessionStatus = 'open' | 'closed' | 'escalated';

export class ChatSession {
  id: string;
  userId?: string | null;
  guestEmail?: string | null;
  subject: string;
  status: ChatSessionStatus;
  escalatedAt?: Date | null;
  lastActivityAt: Date;
  createdAt: Date;

  constructor(partial: Partial<ChatSession>) {
    Object.assign(this, partial);
  }
}
