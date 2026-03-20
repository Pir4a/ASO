import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';

export interface OrderDetailsResponse extends Omit<Order, 'paymentMethod'> {
    paymentMethodDisplay?: string; // Masked card info like "**** **** **** 1234"
}

@Injectable()
export class GetOrderDetailsUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
    ) { }

    async execute(orderId: string, userId: string): Promise<OrderDetailsResponse> {
        const order = await this.orderRepository.findOneByIdAndUserId(orderId, userId);

        if (!order) {
            // Check if order exists but belongs to different user
            const existingOrder = await this.orderRepository.findById(orderId);
            if (existingOrder) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
            }
            throw new NotFoundException('Commande introuvable.');
        }

        // Sanitize payment method info - only show last 4 digits if available
        const paymentMethodDisplay = order.paymentMethod
            ? `**** **** **** ${order.paymentMethod.slice(-4)}`
            : undefined;

        return {
            ...order,
            paymentMethodDisplay,
        };
    }
}
