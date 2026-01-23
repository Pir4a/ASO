import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PromoCodeUsage } from '../entities/promo-code-usage.entity';

@Injectable()
export class TypeOrmPromoCodeUsageRepository {
    private readonly repository: Repository<PromoCodeUsage>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(PromoCodeUsage);
    }

    async findByUserAndPromotion(userId: string, promotionId: string): Promise<PromoCodeUsage[]> {
        return this.repository.find({
            where: { userId, promotionId }
        });
    }

    async countByUserAndPromotion(userId: string, promotionId: string): Promise<number> {
        return this.repository.count({
            where: { userId, promotionId }
        });
    }

    async create(usage: Partial<PromoCodeUsage>): Promise<PromoCodeUsage> {
        const entity = this.repository.create(usage);
        return this.repository.save(entity);
    }
}
