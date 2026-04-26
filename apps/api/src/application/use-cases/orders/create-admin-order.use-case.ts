import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { Address } from '../../../domain/entities/address.entity';
import {
    ORDER_REPOSITORY_TOKEN,
    type OrderRepository,
} from '../../../domain/repositories/order.repository.interface';
import {
    ADDRESS_REPOSITORY_TOKEN,
    type AddressRepository,
} from '../../../domain/repositories/address.repository.interface';
import {
    PRODUCT_REPOSITORY_TOKEN,
    type ProductRepository,
} from '../../../domain/repositories/product.repository.interface';
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { OrderNumberService } from './order-number.service';
import { GenerateInvoiceOnPaymentUseCase } from '../invoices/generate-invoice-on-payment.use-case';
import type { GuestAddressInput } from './create-order.use-case';

export interface CreateAdminOrderInput {
    /** Existing customer the order is created for. Required. */
    customerId: string;
    items: { productId: string; quantity: number }[];
    /** Either a saved address id... */
    addressId?: string;
    /** ...or an inline shipping address (one of the two is required). */
    address?: GuestAddressInput;
    /** Acting admin (for the status-history attribution). */
    adminId: string;
    adminEmail: string;
    /** When true, mark the order as paid + processing immediately and trigger invoice generation. */
    markAsPaid?: boolean;
    /** Free-text label of the chosen payment method (e.g. "manual", "stripe-link", "transfer"). */
    paymentMethod?: string;
}

@Injectable()
export class CreateAdminOrderUseCase {
    private readonly logger = new Logger(CreateAdminOrderUseCase.name);

    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        private readonly orderNumberService: OrderNumberService,
        private readonly generateInvoiceOnPaymentUseCase: GenerateInvoiceOnPaymentUseCase,
    ) { }

    async execute(input: CreateAdminOrderInput): Promise<Order> {
        if (!input.customerId) {
            throw new BadRequestException('customerId is required.');
        }
        if (!input.items || input.items.length === 0) {
            throw new BadRequestException('At least one line item is required.');
        }

        const customer = await this.userRepository.findById(input.customerId);
        if (!customer) throw new NotFoundException('Customer not found.');

        const shippingAddress = await this.resolveAddress(input, customer.id);

        // Snapshot product details (price/name/sku/currency) at order time —
        // never trust the client.
        const products = await Promise.all(
            input.items.map((it) => this.productRepository.findById(it.productId)),
        );
        const items: OrderItem[] = input.items.map((it, i) => {
            const product = products[i];
            if (!product) {
                throw new BadRequestException(`Product ${it.productId} not found.`);
            }
            if (it.quantity <= 0) {
                throw new BadRequestException('Each line quantity must be > 0.');
            }
            return new OrderItem({
                productId: product.id,
                quantity: it.quantity,
                price: Number(product.price),
                productName: product.name,
                productSku: product.sku,
                currency: product.currency || 'EUR',
            });
        });

        const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        const now = new Date();
        const orderNumber = await this.orderNumberService.generate(now);
        const at = now.toISOString();
        const paid = input.markAsPaid === true;

        const status = paid ? 'processing' : 'pending';
        const statusHistory: NonNullable<Order['statusHistory']> = paid
            ? [
                {
                    status: 'pending',
                    at,
                    byUserId: input.adminId,
                    byEmail: input.adminEmail,
                },
                {
                    status: 'processing',
                    at,
                    byUserId: input.adminId,
                    byEmail: input.adminEmail,
                },
            ]
            : [
                {
                    status: 'pending',
                    at,
                    byUserId: input.adminId,
                    byEmail: input.adminEmail,
                },
            ];

        const order = new Order({
            orderNumber,
            userId: customer.id,
            status,
            total,
            currency: 'EUR',
            shippingAddress,
            billingAddress: shippingAddress,
            paymentMethod: input.paymentMethod ?? 'manual',
            paymentStatus: paid ? 'paid' : 'unpaid',
            paidAt: paid ? now : null,
            statusHistory,
            items,
        });

        const created = await this.orderRepository.create(order);

        // Generate the invoice immediately if this admin order is already paid —
        // mirrors what ConfirmOrderPaymentUseCase does on a customer flow.
        if (paid) {
            try {
                await this.generateInvoiceOnPaymentUseCase.execute(created);
            } catch (e) {
                this.logger.warn(
                    `Invoice generation failed for admin-created order ${created.id}: ${(e as Error).message}`,
                );
            }
        }

        return created;
    }

    private async resolveAddress(
        input: CreateAdminOrderInput,
        customerId: string,
    ): Promise<Address> {
        if (input.addressId) {
            const found = await this.addressRepository.findById(input.addressId);
            if (!found) throw new BadRequestException('Address not found.');
            return found;
        }
        if (input.address) {
            return new Address({
                userId: customerId,
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
