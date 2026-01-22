import { Controller, Post, Get, Delete, Body, HttpCode, HttpStatus, Headers, BadRequestException, Request, Param, Req } from '@nestjs/common';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/payment/create-payment-intent.use-case';
import { CreateSetupIntentUseCase } from '../../application/use-cases/payment/create-setup-intent.use-case';
import { GetPaymentMethodsUseCase } from '../../application/use-cases/payment/get-payment-methods.use-case';
import { DeletePaymentMethodUseCase } from '../../application/use-cases/payment/delete-payment-method.use-case';
import { HandleStripeWebhookUseCase } from '../../application/use-cases/payment/handle-stripe-webhook.use-case';
import { RefundPaymentUseCase } from '../../application/use-cases/payment/refund-payment.use-case';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
        private readonly createSetupIntentUseCase: CreateSetupIntentUseCase,
        private readonly getPaymentMethodsUseCase: GetPaymentMethodsUseCase,
        private readonly deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
        private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase,
        private readonly refundPaymentUseCase: RefundPaymentUseCase,
    ) { }

    @Post('intent')
    @HttpCode(HttpStatus.OK)
    async createIntent(@Body('orderId') orderId: string, @Headers('idempotency-key') idempotencyKey?: string) {
        if (!orderId) {
            throw new BadRequestException('Order ID is required');
        }
        return this.createPaymentIntentUseCase.execute(orderId, idempotencyKey);
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

    @Post('webhooks/stripe')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
        const payload = req.rawBody ?? req.body;
        return this.handleStripeWebhookUseCase.execute(signature, payload);
    }

    @Post('refund/:orderId')
    @HttpCode(HttpStatus.OK)
    async refundOrder(@Param('orderId') orderId: string) {
        return this.refundPaymentUseCase.execute(orderId);
    }
}
