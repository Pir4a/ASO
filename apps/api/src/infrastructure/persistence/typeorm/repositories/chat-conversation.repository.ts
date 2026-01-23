import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ChatConversation as TypeOrmChatConversation } from '../entities/chat-conversation.entity';
import { ChatConversation as DomainChatConversation } from '../../../../domain/entities/chat-conversation.entity';
import { ChatConversationRepository } from '../../../../domain/repositories/chat-conversation.repository.interface';

@Injectable()
export class TypeOrmChatConversationRepository implements ChatConversationRepository {
  private readonly repository: Repository<TypeOrmChatConversation>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmChatConversation);
  }

  async create(conversation: DomainChatConversation): Promise<DomainChatConversation> {
    const entity = new TypeOrmChatConversation();
    entity.id = conversation.id;
    entity.sessionId = conversation.sessionId;
    entity.userId = conversation.userId;
    entity.message = conversation.message;
    entity.type = conversation.type;
    entity.metadata = conversation.metadata;
    entity.status = conversation.status;
    entity.escalatedTo = conversation.escalatedTo;

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findBySessionId(sessionId: string): Promise<DomainChatConversation[]> {
    const entities = await this.repository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserId(userId: string): Promise<DomainChatConversation[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'ASC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findActiveConversations(): Promise<DomainChatConversation[]> {
    const entities = await this.repository.find({
      where: { status: 'active' },
      order: { updatedAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findEscalatedConversations(): Promise<DomainChatConversation[]> {
    const entities = await this.repository.find({
      where: { status: 'escalated' },
      order: { updatedAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async updateStatus(id: string, status: string, escalatedTo?: string): Promise<DomainChatConversation | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    entity.status = status as any;
    if (escalatedTo) entity.escalatedTo = escalatedTo;

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: TypeOrmChatConversation): DomainChatConversation {
    return new DomainChatConversation({
      id: entity.id,
      sessionId: entity.sessionId,
      userId: entity.userId,
      message: entity.message,
      type: entity.type,
      metadata: entity.metadata,
      status: entity.status,
      escalatedTo: entity.escalatedTo,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}