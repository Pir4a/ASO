import { Category as DomainCategory } from '../../../../domain/entities/category.entity';
import { Category as TypeOrmCategory } from '../entities/category.entity';

export class CategoryMapper {
    static toDomain(entity: TypeOrmCategory): DomainCategory {
        const category = new DomainCategory({
            id: entity.id,
            slug: entity.slug,
            name: entity.name,
            description: entity.description,
            order: entity.displayOrder,
            displayOrder: entity.displayOrder,
            imageUrl: entity.imageUrl,
            isActive: entity.isActive,
            deletedAt: entity.deletedAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
        return category;
    }

    static toPersistence(domain: DomainCategory): TypeOrmCategory {
        const entity = new TypeOrmCategory();
        entity.id = domain.id;
        entity.slug = domain.slug;
        entity.name = domain.name;
        entity.description = domain.description;
        entity.imageUrl = domain.imageUrl;
        entity.isActive = domain.isActive ?? true;
        entity.displayOrder = domain.displayOrder ?? domain.order ?? 0;
        entity.deletedAt = domain.deletedAt;
        return entity;
    }
}
