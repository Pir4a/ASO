import { Inject, Injectable, BadRequestException } from '@nestjs/common';
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
}

@Injectable()
export class CreateOrderUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
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

        const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        const now = new Date();
        const orderNumber = await this.orderNumberService.generate(now);
        const at = now.toISOString();
        const order = new Order({
            orderNumber,
            // Guests get a sentinel-empty userId; ConfirmOrderPaymentUseCase
            // will create the User and attach them on confirm.
            userId: input.userId ?? '',
            status: 'pending',
            total,
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
