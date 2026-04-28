import * as crypto from 'crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
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

export interface ConfirmOrderPaymentInput {
    orderId: string;
    /** Authenticated user id, when present. */
    userId?: string;
    paymentIntentId?: string;
    /** Required when the order was placed as a guest. */
    guestEmail?: string;
    /** Guest cart key, so we can mark the right cart as ordered. */
    guestCartId?: string;
}

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

    async execute(input: ConfirmOrderPaymentInput): Promise<{ ok: true }> {
        const order = await this.orderRepository.findById(input.orderId);
        if (!order) throw new NotFoundException('Order not found');

        const isGuestOrder = !order.userId;
        let guestSignupToken: string | null = null;
        let resolvedEmail: string | null = null;

        if (isGuestOrder) {
            if (!input.guestEmail) {
                throw new BadRequestException('Guest email required to confirm a guest order.');
            }
            const upserted = await this.upsertGuestUser(input.guestEmail);
            order.userId = upserted.user.id;
            await this.orderRepository.update(order);
            guestSignupToken = upserted.signupToken;
            resolvedEmail = upserted.user.email;
        } else if (input.userId && order.userId !== input.userId) {
            throw new ForbiddenException('Order does not belong to the current user');
        }

        const cartKey = order.userId || input.guestCartId;

        // Resolve the customer's email so the status-history event records WHO triggered it.
        let actorEmail: string | null = null;
        if (order.userId) {
            try {
                const owner = await this.userRepository.findById(order.userId);
                actorEmail = owner?.email ?? null;
            } catch {
                actorEmail = null;
            }
        } else if (input.guestEmail) {
            actorEmail = input.guestEmail;
        }

        const metadata: Parameters<typeof this.orderRepository.updateStatus>[2] = {
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            paidAt: new Date(),
            byUserId: order.userId || null,
            byEmail: actorEmail,
        };
        if (input.paymentIntentId) metadata.paymentId = input.paymentIntentId;

        // Best-effort: fetch card brand + last4 so the order shows the real card later.
        if (input.paymentIntentId) {
            try {
                const card = await this.paymentGateway.retrievePaymentIntentCard(input.paymentIntentId);
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

        if (cartKey) {
            const cart = await this.cartRepository.findByUserId(cartKey);
            if (cart && cart.status === 'active') {
                cart.status = 'ordered';
                await this.cartRepository.update(cart);
            }
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
            const user = finalOrder.userId
                ? await this.userRepository.findById(finalOrder.userId)
                : null;
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

        if (guestSignupToken && resolvedEmail) {
            try {
                await this.emailGateway.sendGuestSignupEmail(
                    resolvedEmail,
                    guestSignupToken,
                    finalOrder.orderNumber ?? finalOrder.id,
                );
            } catch (e) {
                this.logger.warn(
                    `Guest signup email failed for order ${order.id}: ${(e as Error).message}`,
                );
            }
        }

        return { ok: true };
    }

    /**
     * Returns the existing user matching the email, or creates a fresh
     * unverified one with a fresh password-reset token. The returned token
     * is non-null only when a new user was created (so we email the
     * "create your password" link exactly once per guest order).
     */
    private async upsertGuestUser(
        email: string,
    ): Promise<{ user: User; signupToken: string | null }> {
        const normalized = email.trim().toLowerCase();
        const existing = await this.userRepository.findByEmail(normalized);
        if (existing) {
            return { user: existing, signupToken: null };
        }

        const signupToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        // Random unguessable hash so the account is unusable until the user
        // sets a password via the reset-password flow.
        const placeholderHash = crypto.randomBytes(48).toString('hex');

        const created = await this.userRepository.create(
            new User({
                email: normalized,
                passwordHash: placeholderHash,
                role: 'customer',
                isVerified: false,
                isActive: true,
                passwordResetToken: signupToken,
                passwordResetTokenExpires: expires,
                pendingEmail: null,
                pendingEmailToken: null,
                pendingEmailExpires: null,
            }),
        );
        return { user: created, signupToken };
    }
}
