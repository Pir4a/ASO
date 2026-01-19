import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';

@Injectable()
export class CreatePaymentIntentUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
    ) { }

    async execute(orderId: string): Promise<{ clientSecret: string }> {
        // 1. Fetch Order to get current total
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // 2. Create Payment Intent
        const { clientSecret, id } = await this.paymentGateway.createPaymentIntent(
            order.total,
            order.currency,
            { orderId: order.id }
        );

        // 3. Update Order with Payment ID (optional but good for tracking)
        // Note: Status remains 'pending' until webhook confirms payment
        await this.orderRepository.updateStatus(order.id, 'pending', {
            paymentId: id,
            paymentStatus: 'pending' // Initial status
        });

        return { clientSecret };
    }
}
