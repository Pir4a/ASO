import { Cart } from '../entities/cart.entity';

export interface CartRepository {
    findByUserId(userId: string): Promise<Cart | null>;
    findById(id: string): Promise<Cart | null>;
    create(cart: Cart): Promise<Cart>;
    update(cart: Cart): Promise<Cart>;
    delete(id: string): Promise<void>;
}

export const CART_REPOSITORY_TOKEN = 'CartRepository';
