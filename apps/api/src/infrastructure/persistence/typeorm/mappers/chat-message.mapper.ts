import { ChatMessage as DomainChatMessage } from '../../../../domain/entities/chat-message.entity';
import { ChatMessageOrm } from '../entities/chat-message.entity';

export class ChatMessageMapper {
  static toDomain(entity: ChatMessageOrm): DomainChatMessage {
    return new DomainChatMessage({
      id: entity.id,
      sessionId: entity.sessionId,
      role: entity.role,
      content: entity.content,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(domain: DomainChatMessage): ChatMessageOrm {
    const entity = new ChatMessageOrm();
    if (domain.id) entity.id = domain.id;
    entity.sessionId = domain.sessionId;
    entity.role = domain.role;
    entity.content = domain.content;
    return entity;
  }
}
