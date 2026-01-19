import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Promotion as TypeOrmPromotion } from '../entities/promotion.entity';
import { Promotion as DomainPromotion } from '../../../../domain/entities/promotion.entity';
import { PromotionRepository } from '../../../../domain/repositories/promotion.repository.interface';
import { PromotionMapper } from '../mappers/promotion.mapper';

@Injectable()
export class TypeOrmPromotionRepository implements PromotionRepository {
    private readonly repository: Repository<TypeOrmPromotion>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(TypeOrmPromotion);
    }

    async findByCode(code: string): Promise<DomainPromotion | null> {
        const entity = await this.repository.findOne({ where: { code: code.toUpperCase() } });
        if (!entity) return null;
        return PromotionMapper.toDomain(entity);
    }

    async findById(id: string): Promise<DomainPromotion | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return PromotionMapper.toDomain(entity);
    }

    async create(promotion: DomainPromotion): Promise<DomainPromotion> {
        const entity = PromotionMapper.toPersistence(promotion);
        const saved = await this.repository.save(entity);
        return PromotionMapper.toDomain(saved);
    }

    async update(promotion: DomainPromotion): Promise<DomainPromotion> {
        const entity = PromotionMapper.toPersistence(promotion);
        const saved = await this.repository.save(entity);
        return PromotionMapper.toDomain(saved);
    }
}
