import { BadRequestException, Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';
import { ConfirmOrderPaymentUseCase } from '../../application/use-cases/orders/confirm-order-payment.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
    constructor(
        private readonly createOrderUseCase: CreateOrderUseCase,
        private readonly confirmOrderPaymentUseCase: ConfirmOrderPaymentUseCase,
    ) { }

    @Post()
    async createOrder(@Body() body: { addressId: string }, @Request() req: any) {
        const userId = req.user?.sub as string | undefined;
        if (!userId) throw new BadRequestException('Authenticated user required.');
        if (!body.addressId) throw new BadRequestException('addressId is required.');
        return this.createOrderUseCase.execute(userId, body.addressId);
    }

    @Post(':orderId/confirm')
    async confirmPayment(
        @Param('orderId') orderId: string,
        @Body() body: { paymentIntentId?: string },
        @Request() req: any,
    ) {
        const userId = req.user?.sub as string | undefined;
        if (!userId) throw new BadRequestException('Authenticated user required.');
        return this.confirmOrderPaymentUseCase.execute(orderId, userId, body.paymentIntentId);
    }
}
