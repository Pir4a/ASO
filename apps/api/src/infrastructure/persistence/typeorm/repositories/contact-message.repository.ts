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
    entity.message = message.message;
    entity.status = message.status || 'new';
    const saved = await this.repository.save(entity);
    return new DomainContactMessage({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      message: saved.message,
      status: saved.status as any,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }
}
