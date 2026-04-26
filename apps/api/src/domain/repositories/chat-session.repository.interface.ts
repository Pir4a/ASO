import { ChatSession, ChatSessionStatus } from '../entities/chat-session.entity';

export interface ChatSessionFilters {
  status?: ChatSessionStatus;
  escalated?: boolean;
  skip?: number;
  take?: number;
}

export interface ChatSessionRepository {
  create(session: ChatSession): Promise<ChatSession>;
  findById(id: string): Promise<ChatSession | null>;
  findAll(filters: ChatSessionFilters): Promise<{ rows: ChatSession[]; total: number }>;
  update(session: ChatSession): Promise<ChatSession>;
}

export const CHAT_SESSION_REPOSITORY_TOKEN = 'CHAT_SESSION_REPOSITORY';
