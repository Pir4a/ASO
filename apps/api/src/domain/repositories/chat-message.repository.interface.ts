import { ChatMessage } from '../entities/chat-message.entity';

export interface ChatMessageRepository {
  create(message: ChatMessage): Promise<ChatMessage>;
  findBySessionId(sessionId: string): Promise<ChatMessage[]>;
}

export const CHAT_MESSAGE_REPOSITORY_TOKEN = 'CHAT_MESSAGE_REPOSITORY';
