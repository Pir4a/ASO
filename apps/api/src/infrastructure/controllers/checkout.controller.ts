import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';

@Controller('checkout')
export class CheckoutController {
    constructor(
        private readonly createOrderUseCase: CreateOrderUseCase,
    ) { }

    @Post()
    async createOrder(@Body() body: { userId: string; addressId: string }) {
        return this.createOrderUseCase.execute(body.userId, body.addressId);
    }
}
