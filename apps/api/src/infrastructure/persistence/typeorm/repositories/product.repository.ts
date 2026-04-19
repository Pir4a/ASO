import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product as TypeOrmProduct } from '../entities/product.entity';
import { Product as DomainProduct } from '../../../../domain/entities/product.entity';
import { ProductRepository } from '../../../../domain/repositories/product.repository.interface';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
    private readonly repository: Repository<TypeOrmProduct>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(TypeOrmProduct);
    }

    async findAll(): Promise<DomainProduct[]> {
        const entities = await this.repository.find({ relations: ['category'] });
        return entities.map(ProductMapper.toDomain);
    }

    async findOneBySlug(slug: string): Promise<DomainProduct | null> {
        const entity = await this.repository.findOne({ where: { slug }, relations: ['category'] });
        if (!entity) return null;
        return ProductMapper.toDomain(entity);
    }

    async findById(id: string): Promise<DomainProduct | null> {
        const entity = await this.repository.findOne({ where: { id }, relations: ['category'] });
        if (!entity) return null;
        return ProductMapper.toDomain(entity);
    }

    async create(product: DomainProduct): Promise<DomainProduct> {
        const persistenceEntity = ProductMapper.toPersistence(product);
        const newEntity = await this.repository.save(persistenceEntity);
        return ProductMapper.toDomain(newEntity);
    }

    async update(product: DomainProduct): Promise<DomainProduct> {
        const persistenceEntity = ProductMapper.toPersistence(product);
        const saved = await this.repository.save(persistenceEntity);
        const reloaded = await this.repository.findOne({ where: { id: saved.id }, relations: ['category'] });
        return ProductMapper.toDomain(reloaded ?? saved);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async findFeatured(limit: number): Promise<DomainProduct[]> {
        const entities = await this.repository.find({
            where: { featured: true },
            order: { featuredOrder: 'ASC' },
            take: limit,
            relations: ['category'],
        });
        return entities.map(ProductMapper.toDomain);
    }
}
