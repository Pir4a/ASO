import { Controller, Post, Get, Delete, Body, HttpCode, HttpStatus, Headers, BadRequestException, Request, Param } from '@nestjs/common';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/payment/create-payment-intent.use-case';
import { CreateSetupIntentUseCase } from '../../application/use-cases/payment/create-setup-intent.use-case';
import { GetPaymentMethodsUseCase } from '../../application/use-cases/payment/get-payment-methods.use-case';
import { DeletePaymentMethodUseCase } from '../../application/use-cases/payment/delete-payment-method.use-case';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
        private readonly createSetupIntentUseCase: CreateSetupIntentUseCase,
        private readonly getPaymentMethodsUseCase: GetPaymentMethodsUseCase,
        private readonly deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
    ) { }

    @Post('intent')
    @HttpCode(HttpStatus.OK)
    async createIntent(@Body('orderId') orderId: string) {
        if (!orderId) {
            throw new BadRequestException('Order ID is required');
        }
        return this.createPaymentIntentUseCase.execute(orderId);
    }

    @Post('intent/setup')
    @HttpCode(HttpStatus.OK)
    async createSetupIntent(@Request() req: any) {
        const userId = req.user?.id || 'guest-user-id'; // TODO: Real Auth
        return this.createSetupIntentUseCase.execute(userId);
    }

    @Get('methods')
    async getPaymentMethods(@Request() req: any) {
        const userId = req.user?.id || 'guest-user-id'; // TODO: Real Auth
        return this.getPaymentMethodsUseCase.execute(userId);
    }

    @Delete('methods/:id')
    async deletePaymentMethod(@Param('id') paymentMethodId: string) {
        return this.deletePaymentMethodUseCase.execute(paymentMethodId);
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
