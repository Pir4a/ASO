import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Like } from 'typeorm';
import { FAQ as TypeOrmFAQ } from '../entities/faq.entity';
import { FAQ as DomainFAQ } from '../../../../domain/entities/faq.entity';
import { FAQRepository } from '../../../../domain/repositories/faq.repository.interface';

@Injectable()
export class TypeOrmFAQRepository implements FAQRepository {
  private readonly repository: Repository<TypeOrmFAQ>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmFAQ);
  }

  async findAll(): Promise<DomainFAQ[]> {
    const entities = await this.repository.find({ order: { order: 'ASC' } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findAllActive(): Promise<DomainFAQ[]> {
    const entities = await this.repository.find({
      where: { status: 'active' },
      order: { order: 'ASC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findById(id: string): Promise<DomainFAQ | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async create(faq: DomainFAQ): Promise<DomainFAQ> {
    const entity = new TypeOrmFAQ();
    entity.id = faq.id;
    entity.question = faq.question;
    entity.answer = faq.answer;
    entity.status = faq.status;
    entity.order = faq.order;
    entity.viewCount = faq.viewCount;
    entity.helpfulCount = faq.helpfulCount;

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, updates: Partial<DomainFAQ>): Promise<DomainFAQ | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    Object.assign(entity, updates);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async search(query: string): Promise<DomainFAQ[]> {
    const entities = await this.repository.find({
      where: [
        { question: Like(`%${query}%`), status: 'active' },
        { answer: Like(`%${query}%`), status: 'active' }
      ],
      order: { order: 'ASC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'viewCount', 1);
  }

  async incrementHelpfulCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'helpfulCount', 1);
  }

  private toDomain(entity: TypeOrmFAQ): DomainFAQ {
    return new DomainFAQ({
      id: entity.id,
      question: entity.question,
      answer: entity.answer,
      status: entity.status,
      order: entity.order,
      viewCount: entity.viewCount,
      helpfulCount: entity.helpfulCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}