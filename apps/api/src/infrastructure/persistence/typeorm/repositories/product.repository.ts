import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product as TypeOrmProduct } from '../entities/product.entity';
import { Product as DomainProduct } from '../../../../domain/entities/product.entity';
import {
    ProductRepository,
    ProductSearchParams,
    PaginatedResult,
    SearchFacets,
    CategoryFacet,
    PriceRangeFacet
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

    /**
     * Calculate search relevance score based on priority rules:
     * 1. Exact match (score: 100)
     * 2. Starts with (score: 75)
     * 3. Contains (score: 50)
     * 4. Fuzzy/partial (score: 25)
     */
    private calculateRelevanceScore(text: string, searchTerm: string): number {
        const lowerText = text.toLowerCase();
        const lowerSearch = searchTerm.toLowerCase();

        if (lowerText === lowerSearch) return 100;
        if (lowerText.startsWith(lowerSearch)) return 75;
        if (lowerText.includes(lowerSearch)) return 50;

        // Check for one character difference (simple fuzzy)
        if (Math.abs(lowerText.length - lowerSearch.length) <= 1) {
            let diff = 0;
            const shorter = lowerText.length < lowerSearch.length ? lowerText : lowerSearch;
            const longer = lowerText.length >= lowerSearch.length ? lowerText : lowerSearch;
            for (let i = 0; i < shorter.length; i++) {
                if (shorter[i] !== longer[i]) diff++;
            }
            if (diff <= 1) return 25;
        }

        return 0;
    }

    async findWithFilters(params: ProductSearchParams): Promise<PaginatedResult<DomainProduct>> {
        const {
            search,
            categoryId,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 12,
        } = params;

        const queryBuilder: SelectQueryBuilder<TypeOrmProduct> = this.repository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category');

        // Search filter with priority-based matching
        if (search && search.trim()) {
            const searchTerm = search.trim().toLowerCase();
            // Use ILIKE for case-insensitive search (PostgreSQL)
            queryBuilder.andWhere(
                '(LOWER(product.name) LIKE :searchContains OR LOWER(product.description) LIKE :searchContains OR LOWER(product.sku) LIKE :searchContains)',
                { searchContains: `%${searchTerm}%` }
            );
        }

        // Category filter
        if (categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
        }

        // Price range filter
        if (minPrice !== undefined) {
            queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
            queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
        }

        // Status filter
        if (params.status) {
            queryBuilder.andWhere('product.status = :status', { status: params.status });
        }

        // Availability filter
        if (params.availability) {
            if (params.availability === 'in_stock') {
                queryBuilder.andWhere('product.stock > 0');
            }
            if (params.availability === 'out_of_stock') {
                queryBuilder.andWhere('product.stock <= 0');
            }
        }

        // Calculate facets BEFORE pagination
        const facets = await this.calculateFacets(queryBuilder.clone(), params);

        // Sorting - add relevance scoring for search queries
        if (sortBy === 'relevance' && search && search.trim()) {
            // For relevance sorting, we'll fetch all matching results, score them, and sort in memory
            // This is acceptable for moderate result sets
            const allEntities = await queryBuilder.getMany();
            const searchTerm = search.trim();

            // Score each product
            const scoredProducts = allEntities.map(product => ({
                product,
                score: Math.max(
                    this.calculateRelevanceScore(product.name, searchTerm),
                    this.calculateRelevanceScore(product.description || '', searchTerm) * 0.8,
                    this.calculateRelevanceScore(product.sku || '', searchTerm) * 0.6
                )
            }));

            // Sort by score descending
            scoredProducts.sort((a, b) => b.score - a.score);

            const total = scoredProducts.length;
            const skip = (page - 1) * limit;
            const paginatedProducts = scoredProducts.slice(skip, skip + limit);
            const items = paginatedProducts.map(sp => ProductMapper.toDomain(sp.product));

            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                facets,
            };
        }

        // Standard sorting
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
            facets,
        };
    }

    private async calculateFacets(
        baseQuery: SelectQueryBuilder<TypeOrmProduct>,
        params: ProductSearchParams
    ): Promise<SearchFacets> {
        // Category facets - count products per category
        const categoryFacets: CategoryFacet[] = [];
        try {
            const categoryQuery = baseQuery.clone()
                .select('category.id', 'categoryId')
                .addSelect('category.name', 'categoryName')
                .addSelect('COUNT(product.id)', 'count')
                .groupBy('category.id')
                .addGroupBy('category.name');

            const categoryResults = await categoryQuery.getRawMany();
            for (const row of categoryResults) {
                if (row.categoryId) {
                    categoryFacets.push({
                        id: row.categoryId,
                        name: row.categoryName || 'Unknown',
                        count: parseInt(row.count, 10)
                    });
                }
            }
        } catch (e) {
            // Facet calculation is non-critical, log and continue
            console.warn('Failed to calculate category facets:', e);
        }

        // Price range facets - predefined ranges
        const priceRanges: PriceRangeFacet[] = [];
        const ranges = [
            { min: 0, max: 5000 },           // 0-50€
            { min: 5000, max: 10000 },       // 50-100€
            { min: 10000, max: 25000 },      // 100-250€
            { min: 25000, max: 50000 },      // 250-500€
            { min: 50000, max: Infinity },   // 500€+
        ];

        try {
            for (const range of ranges) {
                const priceQuery = baseQuery.clone()
                    .andWhere('product.price >= :rangeMin', { rangeMin: range.min });
                if (range.max !== Infinity) {
                    priceQuery.andWhere('product.price < :rangeMax', { rangeMax: range.max });
                }
                const count = await priceQuery.getCount();
                priceRanges.push({
                    min: range.min,
                    max: range.max === Infinity ? -1 : range.max,
                    count
                });
            }
        } catch (e) {
            console.warn('Failed to calculate price facets:', e);
        }

        // Availability facet
        let inStock = 0;
        let outOfStock = 0;
        try {
            const inStockQuery = baseQuery.clone().andWhere('product.stock > 0');
            const outOfStockQuery = baseQuery.clone().andWhere('product.stock <= 0');
            inStock = await inStockQuery.getCount();
            outOfStock = await outOfStockQuery.getCount();
        } catch (e) {
            console.warn('Failed to calculate availability facets:', e);
        }

        return {
            categories: categoryFacets,
            priceRanges,
            availability: { inStock, outOfStock }
        };
    }
}
