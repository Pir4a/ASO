import { Category as DomainCategory } from '../../../../domain/entities/category.entity';
import { Category as TypeOrmCategory } from '../entities/category.entity';

export class CategoryMapper {
    static toDomain(entity: TypeOrmCategory): DomainCategory {
        const category = new DomainCategory({
            id: entity.id,
            slug: entity.slug,
            name: entity.name,
            description: entity.description,
            order: entity.order,
            isActive: entity.isActive,
        });
        return category;
    }

    static toPersistence(domain: DomainCategory): TypeOrmCategory {
        const entity = new TypeOrmCategory();
        entity.id = domain.id;
        entity.slug = domain.slug;
        entity.name = domain.name;
        entity.description = domain.description;
        entity.order = domain.order;
        entity.isActive = domain.isActive;
        return entity;
    }
}
