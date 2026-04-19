import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Product as TypeOrmProduct } from '../entities/product.entity';
import { Product as DomainProduct } from '../../../../domain/entities/product.entity';
import {
  ProductBrowseParams,
  type ProductSearchParams,
  type ProductSearchResult,
  type ProductSearchSort,
  ProductRepository,
} from '../../../../domain/repositories/product.repository.interface';
import { ProductMapper } from '../mappers/product.mapper';
import { levenshtein } from '../../../../lib/levenshtein';

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const HYBRID_RELEVANCE_MAX_TOTAL = 600;

function escapeIlike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function relevanceJsScore(p: DomainProduct, qRaw: string): number {
  const q = qRaw.trim().toLowerCase();
  if (!q) return 0;
  const name = p.name.toLowerCase();
  const desc = p.description.toLowerCase();
  const sku = p.sku.toLowerCase();
  const slug = p.slug.toLowerCase();
  const specsStr = JSON.stringify(p.specs ?? {}).toLowerCase();
  const hay = `${name} ${desc} ${sku} ${slug} ${specsStr}`;

  if (name === q) return 1_000_000;
  if (sku === q) return 980_000;
  if (slug === q) return 960_000;
  if (
    q.length <= 64 &&
    Math.abs(name.length - q.length) <= 1 &&
    levenshtein(name, q) <= 1
  )
    return 850_000;
  if (q.length <= 32 && levenshtein(sku, q) <= 1) return 820_000;
  if (name.startsWith(q)) return 720_000;
  if (desc.startsWith(q)) return 680_000;
  if (name.includes(q)) return 420_000;
  if (desc.includes(q)) return 400_000;
  if (sku.includes(q)) return 380_000;
  if (hay.includes(q)) return 360_000;
  return 0;
}

function normalizeSort(
  sort: ProductSearchSort,
  hasQuery: boolean,
): ProductSearchSort {
  if (sort === 'relevance' && !hasQuery) return 'novelty_desc';
  return sort;
}

function applySort(
  qb: SelectQueryBuilder<TypeOrmProduct>,
  sort: ProductSearchSort,
  relevanceCaseSql: string | null,
): void {
  switch (sort) {
    case 'relevance':
      if (relevanceCaseSql) {
        qb.orderBy(relevanceCaseSql, 'DESC').addOrderBy(
          'p.listPriority',
          'DESC',
        );
      } else {
        qb.orderBy('p.listPriority', 'DESC').addOrderBy('p.name', 'ASC');
      }
      break;
    case 'price_asc':
      qb.orderBy('p.price', 'ASC').addOrderBy('p.name', 'ASC');
      break;
    case 'price_desc':
      qb.orderBy('p.price', 'DESC').addOrderBy('p.name', 'ASC');
      break;
    case 'novelty_desc':
      qb.orderBy('p.listPriority', 'DESC').addOrderBy('p.name', 'ASC');
      break;
    case 'novelty_asc':
      qb.orderBy('p.listPriority', 'ASC').addOrderBy('p.name', 'ASC');
      break;
    case 'availability_asc':
      qb.orderBy('CASE WHEN p.stock > 0 THEN 0 ELSE 1 END', 'ASC')
        .addOrderBy('p.stock', 'DESC')
        .addOrderBy('p.name', 'ASC');
      break;
    case 'availability_desc':
      qb.orderBy('CASE WHEN p.stock > 0 THEN 0 ELSE 1 END', 'DESC')
        .addOrderBy('p.stock', 'ASC')
        .addOrderBy('p.name', 'ASC');
      break;
    default:
      qb.orderBy('p.listPriority', 'DESC').addOrderBy('p.name', 'ASC');
  }
}

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  private readonly repository: Repository<TypeOrmProduct>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmProduct);
  }

  async findAll(): Promise<DomainProduct[]> {
    const entities = await this.repository.find({ relations: ['category'] });
    return entities.map((e) => ProductMapper.toDomain(e));
  }

  async findOneBySlug(slug: string): Promise<DomainProduct | null> {
    const entity = await this.repository.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!entity) return null;
    return ProductMapper.toDomain(entity);
  }

  async findById(id: string): Promise<DomainProduct | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['category'],
    });
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
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['category'],
    });
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
    return entities.map((e) => ProductMapper.toDomain(e));
  }

  async browse(
    params: ProductBrowseParams,
  ): Promise<{ items: DomainProduct[]; total: number }> {
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
    return { items: entities.map((e) => ProductMapper.toDomain(e)), total };
  }

  async findRelatedBySlug(
    slug: string,
    limit: number,
  ): Promise<DomainProduct[]> {
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
    return merged.map((e) => ProductMapper.toDomain(e));
  }

  private applySearchWhere(
    qb: SelectQueryBuilder<TypeOrmProduct>,
    filters: Pick<
      ProductSearchParams,
      | 'q'
      | 'minPrice'
      | 'maxPrice'
      | 'inStockOnly'
      | 'categoryId'
      | 'categorySlug'
    >,
    omitCategory: boolean,
  ): void {
    if (!omitCategory && filters.categoryId) {
      qb.andWhere('p.categoryId = :searchCid', {
        searchCid: filters.categoryId,
      });
    } else if (!omitCategory && filters.categorySlug) {
      qb.andWhere('c.slug = :searchCslug', {
        searchCslug: filters.categorySlug,
      });
    }
    if (filters.minPrice !== undefined && !Number.isNaN(filters.minPrice)) {
      qb.andWhere('p.price >= :searchMinP', { searchMinP: filters.minPrice });
    }
    if (filters.maxPrice !== undefined && !Number.isNaN(filters.maxPrice)) {
      qb.andWhere('p.price <= :searchMaxP', { searchMaxP: filters.maxPrice });
    }
    if (filters.inStockOnly) {
      qb.andWhere('p.stock > 0');
    }
    const trimmed = filters.q?.trim() ?? '';
    if (trimmed) {
      const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
      tokens.forEach((tok, i) => {
        const like = `%${escapeIlike(tok)}%`;
        const param = `searchFtok${i}`;
        qb.andWhere(
          new Brackets((w) => {
            w.where(`p.name ILIKE :${param} ESCAPE '\\'`, { [param]: like })
              .orWhere(`p.description ILIKE :${param} ESCAPE '\\'`, {
                [param]: like,
              })
              .orWhere(`p.sku ILIKE :${param} ESCAPE '\\'`, { [param]: like })
              .orWhere(`CAST(p.specs AS TEXT) ILIKE :${param} ESCAPE '\\'`, {
                [param]: like,
              });
          }),
        );
      });
    }
  }

  async search(params: ProductSearchParams): Promise<ProductSearchResult> {
    const t0 = Date.now();
    let minP = params.minPrice;
    let maxP = params.maxPrice;
    if (minP !== undefined && maxP !== undefined && minP > maxP) {
      const t = minP;
      minP = maxP;
      maxP = t;
    }

    const trimmed = params.q?.trim() ?? '';
    const hasQuery = trimmed.length > 0;
    const sort = normalizeSort(params.sort, hasQuery);
    const lc = trimmed.toLowerCase();

    const filterPayload = {
      q: params.q,
      minPrice: minP,
      maxPrice: maxP,
      inStockOnly: params.inStockOnly,
      categoryId: params.categoryId,
      categorySlug: params.categorySlug,
    };

    const facetQb = this.repository
      .createQueryBuilder('p')
      .innerJoin('p.category', 'c');
    this.applySearchWhere(facetQb, filterPayload, true);
    facetQb
      .select('c.id', 'facetId')
      .addSelect('c.name', 'facetName')
      .addSelect('c.slug', 'facetSlug')
      .addSelect('COUNT(*)', 'facetCount')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.slug')
      .orderBy('c.name', 'ASC');
    const facetRows = await facetQb.getRawMany<{
      facetId: string;
      facetName: string;
      facetSlug: string;
      facetCount: string;
    }>();
    const facets = {
      categories: facetRows.map((r) => ({
        id: r.facetId,
        name: r.facetName,
        slug: r.facetSlug,
        count: Number.parseInt(r.facetCount, 10) || 0,
      })),
    };

    const base = () => {
      const qb = this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.category', 'c');
      this.applySearchWhere(qb, filterPayload, false);
      return qb;
    };

    const total = await base().getCount();

    const relCase =
      hasQuery && sort === 'relevance'
        ? `(CASE
                    WHEN LOWER(p.name) = :qExact THEN 10000
                    WHEN LOWER(p.sku) = :qExact THEN 9800
                    WHEN LOWER(p.slug) = :qExact THEN 9600
                    WHEN LOWER(p.name) LIKE :qPref ESCAPE '\\' THEN 7200
                    WHEN LOWER(p.description) LIKE :qPref ESCAPE '\\' THEN 6800
                    WHEN LOWER(p.name) LIKE :qLike ESCAPE '\\' THEN 4200
                    WHEN LOWER(p.description) LIKE :qLike ESCAPE '\\' THEN 4000
                    WHEN CAST(p.specs AS TEXT) ILIKE :qLikeRaw ESCAPE '\\' THEN 3600
                    WHEN LOWER(p.sku) LIKE :qLike ESCAPE '\\' THEN 3400
                    ELSE 0
                  END)`
        : null;

    const escLc = escapeIlike(lc);

    let items: DomainProduct[];
    let relevanceRefined = false;

    if (
      sort === 'relevance' &&
      hasQuery &&
      total > 0 &&
      total <= HYBRID_RELEVANCE_MAX_TOTAL
    ) {
      const qb = base();
      const entities = await qb.getMany();
      const domain = entities.map((e) => ProductMapper.toDomain(e));
      domain.sort((a, b) => {
        const sa = relevanceJsScore(a, trimmed);
        const sb = relevanceJsScore(b, trimmed);
        if (sb !== sa) return sb - sa;
        const pa = a.listPriority ?? 0;
        const pb = b.listPriority ?? 0;
        if (pb !== pa) return pb - pa;
        return a.name.localeCompare(b.name);
      });
      relevanceRefined = true;
      const start = (params.page - 1) * params.pageSize;
      items = domain.slice(start, start + params.pageSize);
    } else {
      const qb = base();
      const useSqlRelevance = Boolean(
        relCase &&
        sort === 'relevance' &&
        hasQuery &&
        total > HYBRID_RELEVANCE_MAX_TOTAL,
      );
      if (useSqlRelevance) {
        qb.setParameter('qExact', lc);
        qb.setParameter('qPref', `${escLc}%`);
        qb.setParameter('qLike', `%${escLc}%`);
        qb.setParameter('qLikeRaw', `%${escapeIlike(trimmed)}%`);
      }
      applySort(qb, sort, useSqlRelevance ? relCase : null);
      qb.skip((params.page - 1) * params.pageSize).take(params.pageSize);
      const entities = await qb.getMany();
      items = entities.map((e) => ProductMapper.toDomain(e));
    }

    const tookMs = Math.max(0, Date.now() - t0);
    return { items, total, facets, tookMs, relevanceRefined };
  }
}
