import { Address } from './address.entity';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type OrderStatusEvent = {
    status: OrderStatus;
    at: string;
    byUserId?: string | null;
    byEmail?: string | null;
};

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
    /** Customer-facing identifier (e.g. ALT-20260425-0001). Persisted at create time. */
    orderNumber: string | null;
    userId: string | null;
    status: OrderStatus;
    total: number;
    currency: string;
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod?: string;
    paymentId?: string;
    paymentMethodId?: string; // Stripe pm_…
    paymentBrand?: string;
    paymentLast4?: string;
    paymentStatus?: string;
    /** Set when the payment is confirmed (status flips to processing). */
    paidAt?: Date | null;
    /** Append-only status timeline for admin / support. */
    statusHistory?: OrderStatusEvent[];
    createdAt: Date;
    updatedAt: Date;
    items: OrderItem[];

    constructor(partial: Partial<Order>) {
        Object.assign(this, partial);
    }
}
