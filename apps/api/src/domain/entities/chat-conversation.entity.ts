export type MessageType = 'user' | 'bot' | 'system';
export type ConversationStatus = 'active' | 'escalated' | 'closed';

export class ChatConversation {
  id: string;
  sessionId?: string;
  userId?: string;
  message: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
  status: ConversationStatus;
  escalatedTo?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ChatConversation>) {
    Object.assign(this, partial);
  }
}