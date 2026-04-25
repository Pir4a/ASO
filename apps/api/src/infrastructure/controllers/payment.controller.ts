import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/payment/create-payment-intent.use-case';
import { CreateSetupIntentUseCase } from '../../application/use-cases/payment/create-setup-intent.use-case';
import { GetPaymentMethodsUseCase } from '../../application/use-cases/payment/get-payment-methods.use-case';
import { DeletePaymentMethodUseCase } from '../../application/use-cases/payment/delete-payment-method.use-case';
import { SetDefaultPaymentMethodUseCase } from '../../application/use-cases/payment/set-default-payment-method.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface AuthedRequest {
    user: { sub: string };
}

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
        private readonly createSetupIntentUseCase: CreateSetupIntentUseCase,
        private readonly getPaymentMethodsUseCase: GetPaymentMethodsUseCase,
        private readonly deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
        private readonly setDefaultPaymentMethodUseCase: SetDefaultPaymentMethodUseCase,
    ) { }

    /* ── Checkout intent (auth optional — guests can pay) ──── */
    @Post('intent')
    @HttpCode(HttpStatus.OK)
    async createIntent(
        @Body('orderId') orderId: string,
        @Body('userId') bodyUserId?: string,
    ) {
        if (!orderId) {
            throw new BadRequestException('Order ID is required');
        }
        return this.createPaymentIntentUseCase.execute(orderId, bodyUserId);
    }

    /* ── Profile / saved cards (require auth) ──────────────── */
    @Post('intent/setup')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async createSetupIntent(@Request() req: AuthedRequest) {
        return this.createSetupIntentUseCase.execute(req.user.sub);
    }

    @Get('methods')
    @UseGuards(JwtAuthGuard)
    async getPaymentMethods(@Request() req: AuthedRequest) {
        return this.getPaymentMethodsUseCase.execute(req.user.sub);
    }

    @Delete('methods/:id')
    @UseGuards(JwtAuthGuard)
    async deletePaymentMethod(@Param('id') paymentMethodId: string) {
        return this.deletePaymentMethodUseCase.execute(paymentMethodId);
    }

    @Patch('methods/:id/default')
    @UseGuards(JwtAuthGuard)
    async setDefaultPaymentMethod(
        @Request() req: AuthedRequest,
        @Param('id') paymentMethodId: string,
    ) {
        await this.setDefaultPaymentMethodUseCase.execute(req.user.sub, paymentMethodId);
        return { success: true };
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Headers('stripe-signature') _signature: string,
        @Body() body: { type?: string },
    ) {
        // Placeholder for webhook handling
        console.log('Received webhook', body?.type);
        return { received: true };
    }
}
