import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Promotion } from '../../../domain/entities/promotion.entity';
import type { PromotionRepository } from '../../../domain/repositories/promotion.repository.interface';
import { PROMOTION_REPOSITORY_TOKEN } from '../../../domain/repositories/promotion.repository.interface';
import { TypeOrmPromoCodeUsageRepository } from '../../../infrastructure/persistence/typeorm/repositories/promo-code-usage.repository';

export interface ApplyPromotionResult {
    discount: number;
    promotionId: string;
    promotionCode: string;
    message: string;
}

export interface ApplyPromotionParams {
    promoCode: string;
    orderTotal: number;
    userId?: string;
    orderId?: string;
}

@Injectable()
export class ApplyPromotionUseCase {
    constructor(
        @Inject(PROMOTION_REPOSITORY_TOKEN)
        private readonly promotionRepository: PromotionRepository,
        private readonly promoCodeUsageRepository: TypeOrmPromoCodeUsageRepository,
    ) { }

    async execute(params: ApplyPromotionParams): Promise<ApplyPromotionResult>;
    async execute(promoCode: string, orderTotal: number): Promise<ApplyPromotionResult>;
    async execute(
        promoCodeOrParams: string | ApplyPromotionParams,
        orderTotalArg?: number
    ): Promise<ApplyPromotionResult> {
        // Handle both old signature and new params object
        const promoCode = typeof promoCodeOrParams === 'string'
            ? promoCodeOrParams
            : promoCodeOrParams.promoCode;
        const orderTotal = typeof promoCodeOrParams === 'string'
            ? orderTotalArg!
            : promoCodeOrParams.orderTotal;
        const userId = typeof promoCodeOrParams === 'string'
            ? undefined
            : promoCodeOrParams.userId;
        const orderId = typeof promoCodeOrParams === 'string'
            ? undefined
            : promoCodeOrParams.orderId;

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

        // Check per-user usage limit
        if (userId && promotion.maxUsagesPerUser) {
            const userUsageCount = await this.promoCodeUsageRepository.countByUserAndPromotion(
                userId,
                promotion.id
            );
            if (userUsageCount >= promotion.maxUsagesPerUser) {
                throw new BadRequestException('You have already used this promo code the maximum number of times');
            }
        }

        const discount = promotion.calculateDiscount(orderTotal);

        // Increment global usage count
        promotion.currentUsages += 1;
        await this.promotionRepository.update(promotion);

        // Record per-user usage
        if (userId) {
            await this.promoCodeUsageRepository.create({
                promotionId: promotion.id,
                userId,
                orderId,
            });
        }

        return {
            discount,
            promotionId: promotion.id,
            promotionCode: promotion.code,
            message: `Discount of ${discount / 100} EUR applied!`,
        };
    }
}

