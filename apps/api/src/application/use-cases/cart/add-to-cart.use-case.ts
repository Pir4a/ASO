import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cart, CartItem } from '../../../domain/entities/cart.entity';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AddToCartUseCase {
    constructor(
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
    ) { }

    async execute(userId: string, productId: string, quantity: number): Promise<Cart> {
        // Validate product exists and has stock
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        let cart = await this.cartRepository.findByUserId(userId);

        if (!cart) {
            cart = new Cart({
                id: uuidv4(),
                userId,
                status: 'active',
                items: [],
            });
            cart = await this.cartRepository.create(cart);
        }

        const existingItem = cart.items.find(item => item.productId === productId);
        const newTotalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

        // Validate stock
        if (product.stock < newTotalQuantity) {
            throw new BadRequestException(`Only ${product.stock} items available. You have ${existingItem?.quantity || 0} in cart.`);
        }

        if (existingItem) {
            existingItem.quantity = newTotalQuantity;
            existingItem.priceAtAdd = product.price;
        } else {
            cart.items.push(new CartItem({
                id: uuidv4(),
                cartId: cart.id,
                productId,
                quantity,
                priceAtAdd: product.price,
                productName: product.name,
                productSlug: product.slug,
                productThumbnailUrl: product.thumbnailUrl,
                productPrice: product.price,
                productCurrency: product.currency,
            }));
        }

        return this.cartRepository.update(cart);
    }
}
