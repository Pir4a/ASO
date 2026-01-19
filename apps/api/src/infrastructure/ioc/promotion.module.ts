import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from '../persistence/typeorm/entities/promotion.entity';
import { TypeOrmPromotionRepository } from '../persistence/typeorm/repositories/promotion.repository';
import { PROMOTION_REPOSITORY_TOKEN } from '../../domain/repositories/promotion.repository.interface';

@Module({
    imports: [
        TypeOrmModule.forFeature([Promotion]),
    ],
    providers: [
        {
            provide: PROMOTION_REPOSITORY_TOKEN,
            useClass: TypeOrmPromotionRepository,
        },
    ],
    exports: [PROMOTION_REPOSITORY_TOKEN],
})
export class PromotionModule { }
