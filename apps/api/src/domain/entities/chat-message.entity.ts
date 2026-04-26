export type ChatMessageRole = 'user' | 'assistant' | 'admin';

export class ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;

  constructor(partial: Partial<ChatMessage>) {
    Object.assign(this, partial);
  }
}
