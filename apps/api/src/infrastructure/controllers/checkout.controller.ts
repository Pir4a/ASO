import {
    BadRequestException,
    Body,
    Controller,
    Headers,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    CreateOrderUseCase,
    type GuestAddressInput,
} from '../../application/use-cases/orders/create-order.use-case';
import { ConfirmOrderPaymentUseCase } from '../../application/use-cases/orders/confirm-order-payment.use-case';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

interface CreateCheckoutBody {
    /** Saved address id (preferred for logged-in users). */
    addressId?: string;
    /** Inline shipping address (used by guests with no saved address). */
    address?: GuestAddressInput;
    /** Promo code applied at the cart step. */
    promoCode?: string;
}

interface ConfirmCheckoutBody {
    paymentIntentId?: string;
    /** Required for a guest order; ignored for authenticated users. */
    guestEmail?: string;
}

@Controller('checkout')
@UseGuards(OptionalJwtAuthGuard)
export class CheckoutController {
    constructor(
        private readonly createOrderUseCase: CreateOrderUseCase,
        private readonly confirmOrderPaymentUseCase: ConfirmOrderPaymentUseCase,
    ) { }

    @Post()
    async createOrder(
        @Body() body: CreateCheckoutBody,
        @Request() req: any,
        @Headers('x-guest-cart-id') guestCartId?: string,
    ) {
        const userId = req.user?.sub as string | undefined;
        if (!userId && !guestCartId) {
            throw new BadRequestException(
                'Either an authenticated session or an x-guest-cart-id header is required.',
            );
        }
        if (userId && !body.addressId && !body.address) {
            throw new BadRequestException('addressId or inline address is required.');
        }
        if (!userId && !body.address) {
            throw new BadRequestException('Inline address is required for guest checkout.');
        }
        return this.createOrderUseCase.execute({
            userId,
            guestCartId: userId ? undefined : guestCartId,
            addressId: body.addressId,
            address: body.address,
            promoCode: body.promoCode,
        });
    }

    @Post(':orderId/confirm')
    async confirmPayment(
        @Param('orderId') orderId: string,
        @Body() body: ConfirmCheckoutBody,
        @Request() req: any,
        @Headers('x-guest-cart-id') guestCartId?: string,
    ) {
        const userId = req.user?.sub as string | undefined;
        return this.confirmOrderPaymentUseCase.execute({
            orderId,
            userId,
            paymentIntentId: body.paymentIntentId,
            guestEmail: body.guestEmail,
            guestCartId: userId ? undefined : guestCartId,
        });
    }
}
