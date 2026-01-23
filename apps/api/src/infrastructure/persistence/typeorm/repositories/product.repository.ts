import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product as TypeOrmProduct } from '../entities/product.entity';
import { Product as DomainProduct } from '../../../../domain/entities/product.entity';
import {
    ProductRepository,
    ProductSearchParams,
    PaginatedResult
} from '../../../../domain/repositories/product.repository.interface';
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
        const savedEntity = await this.repository.save(persistenceEntity);
        return ProductMapper.toDomain(savedEntity);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id });
    }

    async bulkUpdate(ids: string[], payload: Partial<DomainProduct>): Promise<void> {
        if (ids.length === 0) return;
        await this.repository.update({ id: In(ids) }, payload as any);
    }

    async findWithFilters(params: ProductSearchParams): Promise<PaginatedResult<DomainProduct>> {
        const {
            search,
            categoryId,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 12,
        } = params;

        const queryBuilder: SelectQueryBuilder<TypeOrmProduct> = this.repository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category');

        // Search filter - search in name and description
        if (search && search.trim()) {
            const searchTerm = `%${search.trim().toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(product.sku) LIKE :search)',
                { search: searchTerm }
            );
        }

        // Category filter
        if (categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
        }

        if (params.status) {
            queryBuilder.andWhere('product.status = :status', { status: params.status });
        }

        if (params.availability) {
            if (params.availability === 'in_stock') {
                queryBuilder.andWhere('product.stock > 0');
            }
            if (params.availability === 'out_of_stock') {
                queryBuilder.andWhere('product.stock <= 0');
            }
        }

        // Sorting
        const validSortFields = ['createdAt', 'name', 'price', 'displayOrder'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
        queryBuilder.orderBy(`product.${sortField}`, order);

        // Get total count before pagination
        const total = await queryBuilder.getCount();

        // Pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const entities = await queryBuilder.getMany();
        const items = entities.map(ProductMapper.toDomain);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
