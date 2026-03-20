import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ContactMessage as TypeOrmContactMessage } from '../entities/contact-message.entity';
import { ContactMessage as DomainContactMessage } from '../../../../domain/entities/contact-message.entity';
import { ContactMessageRepository } from '../../../../domain/repositories/contact-message.repository.interface';

@Injectable()
export class TypeOrmContactMessageRepository implements ContactMessageRepository {
  private readonly repository: Repository<TypeOrmContactMessage>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmContactMessage);
  }

  async create(message: DomainContactMessage): Promise<DomainContactMessage> {
    const entity = new TypeOrmContactMessage();
    entity.id = message.id;
    entity.name = message.name;
    entity.email = message.email;
    entity.subject = message.subject;
    entity.message = message.message;
    entity.status = message.status || 'new';
    entity.adminReply = message.adminReply;
    entity.repliedAt = message.repliedAt;
    const saved = await this.repository.save(entity);
    return new DomainContactMessage({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      subject: saved.subject,
      message: saved.message,
      status: saved.status as any,
      adminReply: saved.adminReply,
      repliedAt: saved.repliedAt,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }

  async findAll(): Promise<DomainContactMessage[]> {
    const entities = await this.repository.find({ order: { createdAt: 'DESC' } });
    return entities.map(entity => new DomainContactMessage({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      subject: entity.subject,
      message: entity.message,
      status: entity.status as any,
      adminReply: entity.adminReply,
      repliedAt: entity.repliedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));
  }

  async findById(id: string): Promise<DomainContactMessage | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return new DomainContactMessage({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      subject: entity.subject,
      message: entity.message,
      status: entity.status as any,
      adminReply: entity.adminReply,
      repliedAt: entity.repliedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async update(id: string, updates: Partial<DomainContactMessage>): Promise<DomainContactMessage | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    Object.assign(entity, updates);
    const saved = await this.repository.save(entity);
    return new DomainContactMessage({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      subject: saved.subject,
      message: saved.message,
      status: saved.status as any,
      adminReply: saved.adminReply,
      repliedAt: saved.repliedAt,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }
}
