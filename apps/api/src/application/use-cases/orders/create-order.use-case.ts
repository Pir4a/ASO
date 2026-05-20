import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { Address } from '../../../domain/entities/address.entity';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import type { PromotionRepository } from '../../../domain/repositories/promotion.repository.interface';
import { PROMOTION_REPOSITORY_TOKEN } from '../../../domain/repositories/promotion.repository.interface';
import { OrderNumberService } from './order-number.service';

export interface GuestAddressInput {
    firstName?: string;
    lastName?: string;
    street: string;
    address2?: string;
    city: string;
    region?: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface CreateOrderInput {
    /** Authenticated user id, when present. */
    userId?: string;
    /** Guest cart key (the `x-guest-cart-id` header on cart endpoints). */
    guestCartId?: string;
    /** Saved address id (preferred for logged-in users). */
    addressId?: string;
    /** Inline address payload, used by guests with no saved addresses. */
    address?: GuestAddressInput;
    /** Promo code applied at cart step. Validated and persisted on the order. */
    promoCode?: string;
}

@Injectable()
export class CreateOrderUseCase {
    private readonly logger = new Logger(CreateOrderUseCase.name);

    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
        @Inject(PROMOTION_REPOSITORY_TOKEN)
        private readonly promotionRepository: PromotionRepository,
        private readonly orderNumberService: OrderNumberService,
    ) { }

    async execute(input: CreateOrderInput): Promise<Order> {
        const cartKey = input.userId ?? input.guestCartId;
        if (!cartKey) {
            throw new BadRequestException('Cart owner missing (userId or guestCartId required).');
        }

        const cart = await this.cartRepository.findByUserId(cartKey);
        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const shippingAddress = await this.resolveAddress(input);

        const products = await Promise.all(
            cart.items.map((item) => this.productRepository.findById(item.productId)),
        );

        const items = cart.items.map((item, i) => {
            const product = products[i];
            const price =
                product?.price !== undefined ? Number(product.price) : item.priceAtAdd || 0;
            return new OrderItem({
                productId: item.productId,
                quantity: item.quantity,
                price,
                productName: product?.name ?? 'Produit',
                productSku: product?.sku ?? '—',
                currency: product?.currency ?? 'EUR',
            });
        });

        const grossTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        // Promo handling. The cart-page promo endpoint is stateless: it only
        // returns a discount preview. The Stripe payment intent is later
        // created from `order.total`, so the discount MUST live on the order
        // — otherwise the customer would be charged the gross amount.
        const { finalTotal, discountAmount, promotionCode } =
            await this.applyPromo(grossTotal, input.promoCode);

        const now = new Date();
        const orderNumber = await this.orderNumberService.generate(now);
        const at = now.toISOString();
        const order = new Order({
            orderNumber,
            // Guests get a sentinel-empty userId; ConfirmOrderPaymentUseCase
            // will create the User and attach them on confirm.
            userId: input.userId ?? '',
            status: 'pending',
            total: finalTotal,
            promotionCode,
            discountAmount,
            currency: 'EUR',
            shippingAddress,
            billingAddress: shippingAddress,
            statusHistory: [{
                status: 'pending',
                at,
                byUserId: input.userId ?? null,
                byEmail: null,
            }],
            items,
        });

        // Cart is closed only on payment confirmation, never here.
        return this.orderRepository.create(order);
    }

    /**
     * Resolves an optional promo code into a discount applied to the order
     * total. Validates the code against the live `Promotion` row (active,
     * within validity window, under usage cap, min-order respected) and
     * increments `currentUsages` once per persisted order. Throws when the
     * caller asked for a code that's invalid — we'd rather fail the order
     * than silently overcharge.
     *
     * `grossTotal` is in € (decimal). `Promotion.calculateDiscount` works in
     * the same unit it receives, so we convert through cents internally to
     * preserve the int-precision the entity expects for `value` /
     * `minOrderAmount`.
     */
    private async applyPromo(
        grossTotal: number,
        rawCode?: string,
    ): Promise<{ finalTotal: number; discountAmount: number | null; promotionCode: string | null }> {
        const code = rawCode?.trim().toUpperCase();
        if (!code) {
            return { finalTotal: grossTotal, discountAmount: null, promotionCode: null };
        }

        const promotion = await this.promotionRepository.findByCode(code);
        if (!promotion || !promotion.isValid()) {
            throw new BadRequestException('Code promo invalide ou expiré.');
        }

        const grossCents = Math.round(grossTotal * 100);
        if (promotion.minOrderAmount && grossCents < promotion.minOrderAmount) {
            throw new BadRequestException(
                `Montant minimum requis : ${(promotion.minOrderAmount / 100).toFixed(2)} €.`,
            );
        }

        const discountCents = promotion.calculateDiscount(grossCents);
        if (discountCents <= 0) {
            return { finalTotal: grossTotal, discountAmount: null, promotionCode: null };
        }

        const discountAmount = Math.min(grossTotal, discountCents / 100);
        const finalTotal = Math.max(0, grossTotal - discountAmount);

        promotion.currentUsages += 1;
        try {
            await this.promotionRepository.update(promotion);
        } catch (err) {
            // Usage tracking is best-effort — never block an order over it.
            this.logger.warn(
                `Failed to increment usage for ${promotion.code}: ${(err as Error).message}`,
            );
        }

        return {
            finalTotal: Math.round(finalTotal * 100) / 100,
            discountAmount: Math.round(discountAmount * 100) / 100,
            promotionCode: promotion.code,
        };
    }

    private async resolveAddress(input: CreateOrderInput): Promise<Address> {
        if (input.addressId) {
            const found = await this.addressRepository.findById(input.addressId);
            if (!found) throw new BadRequestException('Address not found');
            return found;
        }
        if (input.address) {
            return new Address({
                userId: input.userId ?? '',
                firstName: input.address.firstName,
                lastName: input.address.lastName,
                street: input.address.street,
                address2: input.address.address2,
                city: input.address.city,
                region: input.address.region,
                postalCode: input.address.postalCode,
                country: input.address.country,
                phone: input.address.phone,
            });
        }
        throw new BadRequestException('A shipping address is required (addressId or address).');
    }
}
