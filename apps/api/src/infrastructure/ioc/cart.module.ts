import { Module } from '@nestjs/common';
import { CartController } from '../controllers/cart/cart.controller';
import { GetCartUseCase } from '../../application/use-cases/cart/get-cart.use-case';

@Module({
    controllers: [CartController],
    providers: [GetCartUseCase],
})
export class CartModule { }
