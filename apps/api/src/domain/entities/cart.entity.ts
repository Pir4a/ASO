export type CartStatus = 'active' | 'merged' | 'ordered';

export class CartItem {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    priceAtAdd?: number; // Snapshot
    // Product details helpers for UI
    productName?: string;
    productSlug?: string;
    productThumbnailUrl?: string;
    productPrice?: number;
    productCurrency?: string;

    constructor(partial: Partial<CartItem>) {
        Object.assign(this, partial);
    }
}

export class Cart {
    id: string;
    userId?: string; // Nullable for guest carts
    status: CartStatus;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<Cart>) {
        Object.assign(this, partial);
    }
}
