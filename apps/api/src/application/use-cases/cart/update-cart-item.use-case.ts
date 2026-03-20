import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';

@Injectable()
export class UpdateCartItemUseCase {
    constructor(
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
    ) { }

    async execute(userId: string, productId: string, quantity: number): Promise<Cart> {
        const cart = await this.cartRepository.findByUserId(userId);
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            throw new NotFoundException('Item not found in cart');
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            cart.items.splice(itemIndex, 1);
        } else {
            // Validate stock
            const product = await this.productRepository.findById(productId);
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            if (product.stock < quantity) {
                throw new BadRequestException(`Only ${product.stock} items available in stock`);
            }

            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].priceAtAdd = product.price;
        }

        return this.cartRepository.update(cart);
    }
}
