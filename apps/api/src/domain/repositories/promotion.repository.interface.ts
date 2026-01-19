import { Promotion } from '../entities/promotion.entity';

export interface PromotionRepository {
    findByCode(code: string): Promise<Promotion | null>;
    findById(id: string): Promise<Promotion | null>;
    create(promotion: Promotion): Promise<Promotion>;
    update(promotion: Promotion): Promise<Promotion>;
}

export const PROMOTION_REPOSITORY_TOKEN = 'PromotionRepository';
