import { Controller, Post, Body, HttpCode, HttpStatus, Headers, BadRequestException } from '@nestjs/common';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/payment/create-payment-intent.use-case';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    ) { }

    @Post('intent')
    @HttpCode(HttpStatus.OK)
    async createIntent(@Body('orderId') orderId: string) {
        if (!orderId) {
            throw new BadRequestException('Order ID is required');
        }
        return this.createPaymentIntentUseCase.execute(orderId);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Headers('stripe-signature') signature: string, @Body() body: any) {
        // Placeholder for webhook handling (Task 2)
        // For now just acknowledge receipt to avoid retries
        console.log('Received webhook', body.type);
        return { received: true };
    }
}
