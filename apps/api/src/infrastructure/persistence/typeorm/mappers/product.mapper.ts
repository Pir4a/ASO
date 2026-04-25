import { Product as DomainProduct } from '../../../../domain/entities/product.entity';
import { Product as TypeOrmProduct } from '../entities/product.entity';
import { CategoryMapper } from './category.mapper';

export class ProductMapper {
    static toDomain(entity: TypeOrmProduct): DomainProduct {
        const product = new DomainProduct({
            id: entity.id,
            sku: entity.sku,
            slug: entity.slug,
            name: entity.name,
            description: entity.description,
            price: Number(entity.price), // Ensure number
            vatRate: (entity.vatRate !== undefined && entity.vatRate !== null
                ? Number(entity.vatRate)
                : 20) as DomainProduct['vatRate'],
            currency: entity.currency,
            stock: entity.stock,
            status: entity.status,
            thumbnailUrl: entity.thumbnailUrl,
            featured: entity.featured ?? false,
            featuredOrder: entity.featuredOrder ?? 0,
            listPriority: entity.listPriority ?? 0,
            galleryUrls: entity.galleryUrls ?? undefined,
            specs: entity.specs ?? undefined,
            translations: entity.translations ?? undefined,
            categoryId: entity.categoryId,
            category: entity.category ? CategoryMapper.toDomain(entity.category) : undefined,
        });
        return product;
    }

    static toPersistence(domain: DomainProduct): TypeOrmProduct {
        const entity = new TypeOrmProduct();
        entity.id = domain.id;
        entity.sku = domain.sku;
        entity.slug = domain.slug;
        entity.name = domain.name;
        entity.description = domain.description;
        entity.price = domain.price;
        entity.vatRate = domain.vatRate ?? 20;
        entity.currency = domain.currency;
        entity.stock = domain.stock;
        entity.status = domain.status;
        entity.thumbnailUrl = domain.thumbnailUrl;
        entity.featured = domain.featured ?? false;
        entity.featuredOrder = domain.featuredOrder ?? 0;
        entity.listPriority = domain.listPriority ?? 0;
        entity.galleryUrls = domain.galleryUrls;
        entity.specs = domain.specs;
        entity.translations = domain.translations;
        entity.categoryId = domain.categoryId;
        // Category relation is usually handled by ID, but if full object needed:
        // entity.category = ...
        return entity;
    }
}
