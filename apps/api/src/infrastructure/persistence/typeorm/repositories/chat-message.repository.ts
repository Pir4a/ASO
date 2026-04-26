import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ChatMessageOrm } from '../entities/chat-message.entity';
import { ChatMessage as DomainChatMessage } from '../../../../domain/entities/chat-message.entity';
import { ChatMessageRepository } from '../../../../domain/repositories/chat-message.repository.interface';
import { ChatMessageMapper } from '../mappers/chat-message.mapper';

@Injectable()
export class TypeOrmChatMessageRepository implements ChatMessageRepository {
  private readonly repository: Repository<ChatMessageOrm>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ChatMessageOrm);
  }

  async create(message: DomainChatMessage): Promise<DomainChatMessage> {
    const entity = ChatMessageMapper.toPersistence(message);
    const saved = await this.repository.save(entity);
    return ChatMessageMapper.toDomain(saved);
  }

  async findBySessionId(sessionId: string): Promise<DomainChatMessage[]> {
    const entities = await this.repository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
    return entities.map(ChatMessageMapper.toDomain);
  }
}
