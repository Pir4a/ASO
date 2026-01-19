import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category as TypeOrmCategory } from '../entities/category.entity';
import { Category as DomainCategory } from '../../../../domain/entities/category.entity';
import { CategoryRepository } from '../../../../domain/repositories/category.repository.interface';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
    private readonly repository: Repository<TypeOrmCategory>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(TypeOrmCategory);
    }

    async findAll(): Promise<DomainCategory[]> {
        const entities = await this.repository.find({ order: { order: 'ASC' } });
        return entities.map(CategoryMapper.toDomain);
    }

    async findById(id: string): Promise<DomainCategory | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return CategoryMapper.toDomain(entity);
    }
}
