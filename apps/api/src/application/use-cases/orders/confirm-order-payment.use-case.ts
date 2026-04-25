import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';

/**
 * Marks an order as paid and closes the user's active cart. Also captures the
 * Stripe card brand + last4 used so we can show them later on /orders/:id.
 */
@Injectable()
export class ConfirmOrderPaymentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: CartRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(
    orderId: string,
    userId: string,
    paymentIntentId?: string,
  ): Promise<{ ok: true }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId)
      throw new ForbiddenException('Order does not belong to the current user');

    const metadata: Record<string, string> = {
      paymentStatus: 'paid',
      paymentMethod: 'stripe',
    };
    if (paymentIntentId) metadata.paymentId = paymentIntentId;

    // Best-effort: fetch card brand + last4 so the order shows the real card later.
    if (paymentIntentId) {
      try {
        const card =
          await this.paymentGateway.retrievePaymentIntentCard(paymentIntentId);
        if (card.paymentMethodId)
          metadata.paymentMethodId = card.paymentMethodId;
        if (card.brand) metadata.paymentBrand = card.brand;
        if (card.last4) metadata.paymentLast4 = card.last4;

        // Some Stripe responses don't include the card block on the expanded
        // payment_method. Fall back to a direct PaymentMethod retrieve.
        if (card.paymentMethodId && (!card.brand || !card.last4)) {
          const pm = await this.paymentGateway.retrievePaymentMethod(
            card.paymentMethodId,
          );
          if (pm?.brand && !metadata.paymentBrand)
            metadata.paymentBrand = pm.brand;
          if (pm?.last4 && !metadata.paymentLast4)
            metadata.paymentLast4 = pm.last4;
        }
      } catch (e) {
        console.warn(
          'confirmOrderPayment: failed to fetch Stripe card details',
          e,
        );
      }
    }

    await this.orderRepository.updateStatus(order.id, 'processing', metadata);

    const cart = await this.cartRepository.findByUserId(userId);
    if (cart && cart.status === 'active') {
      cart.status = 'ordered';
      await this.cartRepository.update(cart);
    }

    return { ok: true };
  }
}
