import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../persistence/typeorm/entities/cart.entity';
import { CartItem } from '../persistence/typeorm/entities/cart-item.entity';
import { TypeOrmCartRepository } from '../persistence/typeorm/repositories/cart.repository';
import { CART_REPOSITORY_TOKEN } from '../../domain/repositories/cart.repository.interface';
import { AddToCartUseCase } from '../../application/use-cases/cart/add-to-cart.use-case';
import { GetCartUseCase } from '../../application/use-cases/cart/get-cart.use-case';
import { UpdateCartItemUseCase } from '../../application/use-cases/cart/update-cart-item.use-case';
import { RemoveFromCartUseCase } from '../../application/use-cases/cart/remove-from-cart.use-case';
import { MergeGuestCartUseCase } from '../../application/use-cases/cart/merge-guest-cart.use-case';
import { ApplyPromotionUseCase } from '../../application/use-cases/cart/apply-promotion.use-case';
import { ProductsModule } from './products.module';
import { PromotionModule } from './promotion.module';
import { AuthModule } from './auth.module';
import { CartController } from '../controllers/cart.controller';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cart, CartItem]),
        ProductsModule,
        PromotionModule,
        AuthModule,
    ],
    controllers: [CartController],
    providers: [
        {
            provide: CART_REPOSITORY_TOKEN,
            useClass: TypeOrmCartRepository,
        },
        AddToCartUseCase,
        GetCartUseCase,
        UpdateCartItemUseCase,
        RemoveFromCartUseCase,
        MergeGuestCartUseCase,
        ApplyPromotionUseCase,
        OptionalJwtAuthGuard,
        JwtAuthGuard,
    ],
    exports: [CART_REPOSITORY_TOKEN],
})
export class CartModule { }
