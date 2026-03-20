import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';

@Injectable()
export class CreateOrderUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(EMAIL_GATEWAY)
        private readonly emailGateway: EmailGateway,
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

        // Calculate total
        // Note: Real world would verify prices against product repo again
        const total = cart.items.reduce((sum, item) => {
            // Assuming item.product is loaded eagerly in repo and mapped
            // But Domain CartItem might not have the full Product object depending on mapper.
            // Let's assume for now we use priceAtAdd or would need to fetch.
            // Simplification: use priceAtAdd if available, else 0 (should be validated)
            return sum + (item.priceAtAdd || 0) * item.quantity;
        }, 0);

        const order = new Order({
            userId,
            status: 'pending',
            total,
            currency: 'EUR',
            shippingAddress: address,
            items: cart.items.map(item => new OrderItem({
                productId: item.productId,
                quantity: item.quantity,
                price: item.priceAtAdd || 0,
                // productName/sku would need fetching from product if not in cart item snapshot
                productName: 'Product', // Placeholder
                productSku: 'SKU', // Placeholder
                currency: 'EUR'
            }))
        });

        const createdOrder = await this.orderRepository.create(order);

        // Clear cart
        cart.status = 'ordered';
        await this.cartRepository.update(cart);

        await this.sendConfirmationEmail(userId, createdOrder);

        return createdOrder;
    }

    private async sendConfirmationEmail(userId: string, order: Order): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user?.email) return;

        const invoiceUrl = `${process.env.API_URL || 'http://localhost:3001/api'}/orders/${order.id}/invoice`;
        const customerName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

        const payload = {
            orderId: order.id,
            total: order.total,
            currency: order.currency,
            items: order.items.map(item => ({
                name: item.productName,
                sku: item.productSku,
                quantity: item.quantity,
                price: item.price,
            })),
            invoiceUrl,
            customerName,
        };

        await this.sendWithRetry(user.email, payload);
    }

    private async sendWithRetry(
        to: string,
        payload: {
            orderId: string;
            total: number;
            currency: string;
            items: Array<{ name: string; sku?: string; quantity: number; price: number }>;
            invoiceUrl?: string;
            customerName?: string;
        }
    ) {
        const attempts = 2;
        let lastError: unknown;
        for (let i = 0; i < attempts; i += 1) {
            try {
                await this.emailGateway.sendOrderConfirmationEmail(to, payload);
                return;
            } catch (error) {
                lastError = error;
                console.error('Order confirmation email failed', { attempt: i + 1, error });
            }
        }

        if (lastError) {
            console.error('Order confirmation email permanently failed', lastError);
        }
    }
}
