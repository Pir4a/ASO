import { Address } from './address.entity';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export class OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    price: number; // Snapshot price at time of order
    currency: string;

    constructor(partial: Partial<OrderItem>) {
        Object.assign(this, partial);
    }
}

export class Order {
    id: string;
    userId: string;
    status: OrderStatus;
    total: number;
    currency: string;
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod?: string; // e.g., 'stripe', 'paypal'
    paymentId?: string;
    paymentStatus?: string;
    paidAt?: Date;
    refundId?: string;
    refundedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    items: OrderItem[];

    constructor(partial: Partial<Order>) {
        Object.assign(this, partial);
    }
}
