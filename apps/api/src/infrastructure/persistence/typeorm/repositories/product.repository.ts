import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product as TypeOrmProduct } from '../entities/product.entity';
import { Product as DomainProduct } from '../../../../domain/entities/product.entity';
import {
    ProductBrowseParams,
    ProductRepository,
} from '../../../../domain/repositories/product.repository.interface';

function shuffleInPlace<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
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

    async browse(params: ProductBrowseParams): Promise<{ items: DomainProduct[]; total: number }> {
        const { categoryId, categorySlug, page, pageSize } = params;
        const qb = this.repository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'c');

        if (categoryId) {
            qb.andWhere('p.categoryId = :cid', { cid: categoryId });
        } else if (categorySlug) {
            qb.andWhere('c.slug = :cslug', { cslug: categorySlug });
        }

        qb.orderBy('p.listPriority', 'DESC')
            .addOrderBy('CASE WHEN p.stock > 0 THEN 0 ELSE 1 END', 'ASC')
            .addOrderBy('p.name', 'ASC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [entities, total] = await qb.getManyAndCount();
        return { items: entities.map(ProductMapper.toDomain), total };
    }

    async findRelatedBySlug(slug: string, limit: number): Promise<DomainProduct[]> {
        const current = await this.repository.findOne({
            where: { slug },
            relations: ['category'],
        });
        if (!current) return [];

        const siblings = await this.repository.find({
            where: { categoryId: current.categoryId },
            relations: ['category'],
        });

        const others = siblings.filter((p) => p.slug !== slug);
        const inStock = others.filter((p) => p.stock > 0);
        const outOfStock = others.filter((p) => p.stock <= 0);
        shuffleInPlace(inStock);
        shuffleInPlace(outOfStock);

        const merged = [...inStock, ...outOfStock].slice(0, limit);
        return merged.map(ProductMapper.toDomain);
    }
}
