import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';

@Injectable()
export class RemoveFromCartUseCase {
    constructor(
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
    ) { }

    async execute(userId: string, productId: string): Promise<Cart> {
        const cart = await this.cartRepository.findByUserId(userId);
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            throw new NotFoundException('Item not found in cart');
        }

        cart.items.splice(itemIndex, 1);
        return this.cartRepository.update(cart);
    }
}
