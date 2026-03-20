import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { PAYMENT_INTENT_REPOSITORY_TOKEN } from '../../../domain/repositories/payment-intent.repository.interface';
import type { PaymentIntentRepository } from '../../../domain/repositories/payment-intent.repository.interface';
import { PaymentIntent } from '../../../domain/entities/payment-intent.entity';

@Injectable()
export class CreatePaymentIntentUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(PAYMENT_INTENT_REPOSITORY_TOKEN)
        private readonly paymentIntentRepository: PaymentIntentRepository,
    ) { }

    async execute(orderId: string, idempotencyKey?: string): Promise<{ clientSecret: string }> {
        // 1. Fetch Order to get current total
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const resolvedKey = idempotencyKey || `order-${orderId}`;
        const existing = await this.paymentIntentRepository.findByIdempotencyKey(resolvedKey);
        if (existing?.clientSecret) {
            return { clientSecret: existing.clientSecret };
        }

        // 2. Create Payment Intent
        const { clientSecret, id } = await this.paymentGateway.createPaymentIntent(
            order.total,
            order.currency,
            { orderId: order.id },
            resolvedKey
        );

        await this.paymentIntentRepository.create(new PaymentIntent({
            orderId: order.id,
            idempotencyKey: resolvedKey,
            stripePaymentIntentId: id,
            amount: order.total,
            currency: order.currency,
            status: 'processing',
            clientSecret,
        }));

        // 3. Update Order with Payment ID (optional but good for tracking)
        // Note: Status remains 'pending' until webhook confirms payment
        await this.orderRepository.updateStatus(order.id, order.status || 'pending', {
            paymentId: id,
            paymentStatus: 'pending', // Initial status
            paymentMethod: 'stripe',
        });

        return { clientSecret };
    }
}
