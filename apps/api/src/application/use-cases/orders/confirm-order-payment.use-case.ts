import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';

/**
 * Marks an order as paid and closes the user's active cart.
 * Should be called once the Stripe PaymentIntent has been confirmed client-side
 * (or from a Stripe webhook in production).
 */
@Injectable()
export class ConfirmOrderPaymentUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
    ) { }

    async execute(
        orderId: string,
        userId: string,
        paymentIntentId?: string,
    ): Promise<{ ok: true }> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        if (order.userId !== userId) throw new ForbiddenException('Order does not belong to the current user');

        await this.orderRepository.updateStatus(order.id, 'processing', {
            paymentStatus: 'paid',
            ...(paymentIntentId ? { paymentId: paymentIntentId } : {}),
        });

        const cart = await this.cartRepository.findByUserId(userId);
        if (cart && cart.status === 'active') {
            cart.status = 'ordered';
            await this.cartRepository.update(cart);
        }

        return { ok: true };
    }
}
