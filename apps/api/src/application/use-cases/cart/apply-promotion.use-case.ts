import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Promotion } from '../../../domain/entities/promotion.entity';
import type { PromotionRepository } from '../../../domain/repositories/promotion.repository.interface';
import { PROMOTION_REPOSITORY_TOKEN } from '../../../domain/repositories/promotion.repository.interface';

export interface ApplyPromotionResult {
    discount: number;
    promotionId: string;
    promotionCode: string;
    message: string;
}

@Injectable()
export class ApplyPromotionUseCase {
    constructor(
        @Inject(PROMOTION_REPOSITORY_TOKEN)
        private readonly promotionRepository: PromotionRepository,
    ) { }

    async execute(promoCode: string, orderTotal: number): Promise<ApplyPromotionResult> {
        const promotion = await this.promotionRepository.findByCode(promoCode.toUpperCase());

        if (!promotion) {
            throw new NotFoundException('Promotion code not found');
        }

        if (!promotion.isValid()) {
            throw new BadRequestException('Promotion code is expired or no longer valid');
        }

        if (promotion.minOrderAmount && orderTotal < promotion.minOrderAmount) {
            throw new BadRequestException(`Minimum order amount of ${promotion.minOrderAmount / 100} EUR required`);
        }

        const discount = promotion.calculateDiscount(orderTotal);

        // Increment usage count
        promotion.currentUsages += 1;
        await this.promotionRepository.update(promotion);

        return {
            discount,
            promotionId: promotion.id,
            promotionCode: promotion.code,
            message: `Discount of ${discount / 100} EUR applied!`,
        };
    }
}
