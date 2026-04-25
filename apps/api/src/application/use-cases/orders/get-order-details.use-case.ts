import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';

export interface OrderDetailsResponse extends Order {
    /** Customer-facing order number, e.g. ALT-20260425-AB12. */
    orderNumber: string;
}

/**
 * Builds a stable, customer-facing order number from the order's date + UUID prefix.
 * Format: ALT-YYYYMMDD-XXXX
 */
export function formatOrderNumber(id: string, createdAt: Date | string): string {
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `ALT-${y}${m}${day}-${suffix}`;
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
            const existingOrder = await this.orderRepository.findById(orderId);
            if (existingOrder) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
            }
            throw new NotFoundException('Commande introuvable.');
        }

        return Object.assign(order, {
            orderNumber: formatOrderNumber(order.id, order.createdAt),
        }) as OrderDetailsResponse;
    }
}
