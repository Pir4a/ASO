import { Promotion as DomainPromotion } from '../../../../domain/entities/promotion.entity';
import { Promotion as TypeOrmPromotion } from '../entities/promotion.entity';

export class PromotionMapper {
    static toDomain(entity: TypeOrmPromotion): DomainPromotion {
        return new DomainPromotion({
            id: entity.id,
            code: entity.code,
            type: entity.type,
            value: entity.value,
            minOrderAmount: entity.minOrderAmount,
            maxUsages: entity.maxUsages,
            currentUsages: entity.currentUsages,
            validFrom: entity.validFrom,
            validUntil: entity.validUntil,
            isActive: entity.isActive,
        });
    }

    static toPersistence(domain: DomainPromotion): TypeOrmPromotion {
        const entity = new TypeOrmPromotion();
        entity.id = domain.id;
        entity.code = domain.code;
        entity.type = domain.type;
        entity.value = domain.value;
        entity.minOrderAmount = domain.minOrderAmount;
        entity.maxUsages = domain.maxUsages;
        entity.currentUsages = domain.currentUsages;
        entity.validFrom = domain.validFrom;
        entity.validUntil = domain.validUntil;
        entity.isActive = domain.isActive;
        return entity;
    }
}
