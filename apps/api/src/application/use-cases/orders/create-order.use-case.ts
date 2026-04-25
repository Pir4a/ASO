import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';

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
    ) { }

    async execute(userId: string, addressId: string): Promise<Order> {
        const cart = await this.cartRepository.findByUserId(userId);
        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const address = await this.addressRepository.findById(addressId);
        if (!address) {
            throw new BadRequestException('Address not found');
        }

        // Resolve product name + SKU + price from the catalog so the order has accurate snapshots.
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

        const at = new Date().toISOString();
        const order = new Order({
            userId,
            status: 'pending',
            total,
            currency: 'EUR',
            shippingAddress: address,
            billingAddress: address,
            statusHistory: [{ status: 'pending', at }],
            items,
        });

        // Note: the cart is NOT marked as 'ordered' here. It is only cleared once the payment is
        // confirmed (see ConfirmPaymentUseCase). This protects the user from losing their cart if
        // payment fails or is abandoned after order creation.
        return this.orderRepository.create(order);
    }
}
