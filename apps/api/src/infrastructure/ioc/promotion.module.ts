import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from '../persistence/typeorm/entities/promotion.entity';
import { PromoCodeUsage } from '../persistence/typeorm/entities/promo-code-usage.entity';
import { TypeOrmPromotionRepository } from '../persistence/typeorm/repositories/promotion.repository';
import { TypeOrmPromoCodeUsageRepository } from '../persistence/typeorm/repositories/promo-code-usage.repository';
import { PROMOTION_REPOSITORY_TOKEN } from '../../domain/repositories/promotion.repository.interface';
import { AdminPromoCodesController } from '../controllers/admin/promo-codes.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Promotion, PromoCodeUsage]),
    ],
    controllers: [AdminPromoCodesController],
    providers: [
        {
            provide: PROMOTION_REPOSITORY_TOKEN,
            useClass: TypeOrmPromotionRepository,
        },
        TypeOrmPromoCodeUsageRepository,
    ],
    exports: [PROMOTION_REPOSITORY_TOKEN, TypeOrmPromoCodeUsageRepository],
})
export class PromotionModule { }

