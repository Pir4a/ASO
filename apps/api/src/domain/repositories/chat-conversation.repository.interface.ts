import { ChatConversation } from '../entities/chat-conversation.entity';

export interface ChatConversationRepository {
  create(conversation: ChatConversation): Promise<ChatConversation>;
  findBySessionId(sessionId: string): Promise<ChatConversation[]>;
  findByUserId(userId: string): Promise<ChatConversation[]>;
  findActiveConversations(): Promise<ChatConversation[]>;
  findEscalatedConversations(): Promise<ChatConversation[]>;
  updateStatus(id: string, status: string, escalatedTo?: string): Promise<ChatConversation | null>;
}

export const CHAT_CONVERSATION_REPOSITORY_TOKEN = 'ChatConversationRepository';