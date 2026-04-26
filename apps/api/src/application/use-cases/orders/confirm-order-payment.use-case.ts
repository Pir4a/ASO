import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import { GenerateInvoiceOnPaymentUseCase } from '../invoices/generate-invoice-on-payment.use-case';

/**
 * Marks an order as paid and closes the user's active cart. Also captures the
 * Stripe card brand + last4 used so we can show them later on /orders/:id.
 */
@Injectable()
export class ConfirmOrderPaymentUseCase {
    private readonly logger = new Logger(ConfirmOrderPaymentUseCase.name);

    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(EMAIL_GATEWAY)
        private readonly emailGateway: EmailGateway,
        private readonly generateInvoiceOnPaymentUseCase: GenerateInvoiceOnPaymentUseCase,
    ) { }

    async execute(
        orderId: string,
        userId: string,
        paymentIntentId?: string,
    ): Promise<{ ok: true }> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        if (order.userId !== userId) throw new ForbiddenException('Order does not belong to the current user');

        const metadata: Record<string, string> = {
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
        };
        if (paymentIntentId) metadata.paymentId = paymentIntentId;

        // Best-effort: fetch card brand + last4 so the order shows the real card later.
        if (paymentIntentId) {
            try {
                const card = await this.paymentGateway.retrievePaymentIntentCard(paymentIntentId);
                if (card.paymentMethodId) metadata.paymentMethodId = card.paymentMethodId;
                if (card.brand) metadata.paymentBrand = card.brand;
                if (card.last4) metadata.paymentLast4 = card.last4;

                // Some Stripe responses don't include the card block on the expanded
                // payment_method. Fall back to a direct PaymentMethod retrieve.
                if (card.paymentMethodId && (!card.brand || !card.last4)) {
                    const pm = await this.paymentGateway.retrievePaymentMethod(
                        card.paymentMethodId,
                    );
                    if (pm?.brand && !metadata.paymentBrand) metadata.paymentBrand = pm.brand;
                    if (pm?.last4 && !metadata.paymentLast4) metadata.paymentLast4 = pm.last4;
                }
            } catch (e) {
                console.warn('confirmOrderPayment: failed to fetch Stripe card details', e);
            }
        }

        const updatedOrder = await this.orderRepository.updateStatus(order.id, 'processing', metadata);

        const cart = await this.cartRepository.findByUserId(userId);
        if (cart && cart.status === 'active') {
            cart.status = 'ordered';
            await this.cartRepository.update(cart);
        }

        const finalOrder = updatedOrder ?? order;

        let invoiceNumber: string | undefined;
        let pdfBuffer: Buffer | undefined;
        try {
            const invoiceResult = await this.generateInvoiceOnPaymentUseCase.execute(finalOrder);
            if (invoiceResult) {
                invoiceNumber = invoiceResult.invoice.number;
                pdfBuffer = invoiceResult.pdfBuffer ?? undefined;
            }
        } catch (e) {
            this.logger.warn(
                `Invoice generation failed for order ${order.id}: ${(e as Error).message}`,
            );
        }

        try {
            const user = await this.userRepository.findById(finalOrder.userId);
            if (user?.email) {
                await this.emailGateway.sendOrderConfirmation(user.email, finalOrder, {
                    locale: (user as unknown as { locale?: string }).locale,
                    invoiceNumber,
                    pdfBuffer,
                });
            } else {
                this.logger.warn(
                    `No email available for order ${finalOrder.id} (user ${finalOrder.userId}); skipping confirmation email.`,
                );
            }
        } catch (e) {
            this.logger.warn(
                `Order confirmation email failed for order ${order.id}: ${(e as Error).message}`,
            );
        }

        return { ok: true };
    }
}
