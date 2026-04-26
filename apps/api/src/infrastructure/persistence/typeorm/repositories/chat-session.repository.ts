import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ChatSessionOrm } from '../entities/chat-session.entity';
import { ChatSession as DomainChatSession } from '../../../../domain/entities/chat-session.entity';
import {
  ChatSessionFilters,
  ChatSessionRepository,
} from '../../../../domain/repositories/chat-session.repository.interface';
import { ChatSessionMapper } from '../mappers/chat-session.mapper';

@Injectable()
export class TypeOrmChatSessionRepository implements ChatSessionRepository {
  private readonly repository: Repository<ChatSessionOrm>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ChatSessionOrm);
  }

  async create(session: DomainChatSession): Promise<DomainChatSession> {
    const entity = ChatSessionMapper.toPersistence(session);
    const saved = await this.repository.save(entity);
    return ChatSessionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<DomainChatSession | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ChatSessionMapper.toDomain(entity) : null;
  }

  async findAll(
    filters: ChatSessionFilters,
  ): Promise<{ rows: DomainChatSession[]; total: number }> {
    const qb = this.repository.createQueryBuilder('session');

    if (filters.status) {
      qb.andWhere('session.status = :status', { status: filters.status });
    }
    if (filters.escalated === true) {
      qb.andWhere('session.status = :escalatedStatus', { escalatedStatus: 'escalated' });
    }

    // Escalated first, then by recency.
    qb.orderBy(`CASE WHEN session.status = 'escalated' THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy('session.lastActivityAt', 'DESC');

    if (typeof filters.skip === 'number') qb.skip(filters.skip);
    if (typeof filters.take === 'number') qb.take(filters.take);

    const [entities, total] = await qb.getManyAndCount();
    return { rows: entities.map(ChatSessionMapper.toDomain), total };
  }

  async update(session: DomainChatSession): Promise<DomainChatSession> {
    const entity = ChatSessionMapper.toPersistence(session);
    const saved = await this.repository.save(entity);
    return ChatSessionMapper.toDomain(saved);
  }
}
