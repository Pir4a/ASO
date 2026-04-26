import { ChatSession as DomainChatSession } from '../../../../domain/entities/chat-session.entity';
import { ChatSessionOrm } from '../entities/chat-session.entity';

export class ChatSessionMapper {
  static toDomain(entity: ChatSessionOrm): DomainChatSession {
    return new DomainChatSession({
      id: entity.id,
      userId: entity.userId,
      guestEmail: entity.guestEmail,
      subject: entity.subject,
      status: entity.status,
      escalatedAt: entity.escalatedAt,
      lastActivityAt: entity.lastActivityAt,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(domain: DomainChatSession): ChatSessionOrm {
    const entity = new ChatSessionOrm();
    if (domain.id) entity.id = domain.id;
    entity.userId = domain.userId ?? null;
    entity.guestEmail = domain.guestEmail ?? null;
    entity.subject = domain.subject;
    entity.status = domain.status;
    entity.escalatedAt = domain.escalatedAt ?? null;
    entity.lastActivityAt = domain.lastActivityAt;
    return entity;
  }
}
