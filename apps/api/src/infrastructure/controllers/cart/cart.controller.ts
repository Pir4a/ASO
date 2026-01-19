import { Controller, Get } from '@nestjs/common';
import { GetCartUseCase } from '../../../application/use-cases/cart/get-cart.use-case';

@Controller('cart')
export class CartController {
    constructor(private readonly getCartUseCase: GetCartUseCase) { }

    @Get()
    getCart() {
        return this.getCartUseCase.execute();
    }
}
