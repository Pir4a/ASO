import { Injectable } from '@nestjs/common';
import { DataSource, In, IsNull, Repository } from 'typeorm';
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
        const entities = await this.repository.find({
            where: { isActive: true, deletedAt: IsNull() },
            order: { displayOrder: 'ASC' },
        });
        return entities.map(CategoryMapper.toDomain);
    }

    async findAllAdmin(): Promise<DomainCategory[]> {
        const entities = await this.repository.find({
            where: { deletedAt: IsNull() },
            order: { displayOrder: 'ASC' },
        });
        return entities.map(CategoryMapper.toDomain);
    }

    async findById(id: string): Promise<DomainCategory | null> {
        const entity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
        if (!entity) return null;
        return CategoryMapper.toDomain(entity);
    }

    async findByIdIncludingDeleted(id: string): Promise<DomainCategory | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return CategoryMapper.toDomain(entity);
    }

    async findBySlug(slug: string): Promise<DomainCategory | null> {
        const entity = await this.repository.findOne({ where: { slug, deletedAt: IsNull() } });
        if (!entity) return null;
        return CategoryMapper.toDomain(entity);
    }

    async create(category: DomainCategory): Promise<DomainCategory> {
        const entity = CategoryMapper.toPersistence(category);
        const saved = await this.repository.save(entity);
        return CategoryMapper.toDomain(saved);
    }

    async update(category: DomainCategory): Promise<DomainCategory> {
        const entity = CategoryMapper.toPersistence(category);
        const saved = await this.repository.save(entity);
        return CategoryMapper.toDomain(saved);
    }

    async updateStatus(id: string, isActive: boolean): Promise<DomainCategory> {
        const entity = await this.repository.findOne({ where: { id, deletedAt: IsNull() } });
        if (!entity) throw new Error('Category not found');
        entity.isActive = isActive;
        const saved = await this.repository.save(entity);
        return CategoryMapper.toDomain(saved);
    }

    async reorder(orderUpdates: { id: string; displayOrder: number }[]): Promise<void> {
        await Promise.all(
            orderUpdates.map(({ id, displayOrder }) =>
                this.repository.update({ id }, { displayOrder })
            )
        );
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update({ id }, { deletedAt: new Date(), isActive: false });
    }

    async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<void> {
        if (ids.length === 0) return;
        await this.repository.update({ id: In(ids), deletedAt: IsNull() }, { isActive });
    }

    async bulkSoftDelete(ids: string[]): Promise<void> {
        if (ids.length === 0) return;
        await this.repository.update({ id: In(ids) }, { deletedAt: new Date(), isActive: false });
    }
}
