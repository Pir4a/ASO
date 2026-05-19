import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';

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

/** Same reference as BO / emails (stored sequential number, else legacy fallback). */
export function resolveOrderNumber(order: {
    id: string;
    createdAt: Date | string;
    orderNumber?: string | null;
}): string {
    const stored = order.orderNumber?.trim();
    if (stored) return stored;
    return formatOrderNumber(order.id, order.createdAt);
}

@Injectable()
export class GetOrderDetailsUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
    ) { }

    async execute(orderId: string, userId: string): Promise<OrderDetailsResponse> {
        let order = await this.orderRepository.findOneByIdAndUserId(orderId, userId);

        if (!order) {
            const existingOrder = await this.orderRepository.findById(orderId);
            if (existingOrder) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
            }
            throw new NotFoundException('Commande introuvable.');
        }

        // Lazy backfill: orders that captured `paymentMethodId` but missed the
        // brand/last4 (partial Stripe response) get filled in here on next view.
        if (
            order.paymentMethodId &&
            (!order.paymentBrand || !order.paymentLast4)
        ) {
            try {
                const pm = await this.paymentGateway.retrievePaymentMethod(
                    order.paymentMethodId,
                );
                if (pm?.brand || pm?.last4) {
                    await this.orderRepository.updateStatus(order.id, order.status, {
                        ...(pm.brand ? { paymentBrand: pm.brand } : {}),
                        ...(pm.last4 ? { paymentLast4: pm.last4 } : {}),
                    });
                    order =
                        (await this.orderRepository.findOneByIdAndUserId(orderId, userId)) ??
                        order;
                }
            } catch {
                // ignore — keep the order as-is if Stripe is unreachable
            }
        }

        return Object.assign(order, {
            orderNumber: resolveOrderNumber(order),
        }) as OrderDetailsResponse;
    }
}
