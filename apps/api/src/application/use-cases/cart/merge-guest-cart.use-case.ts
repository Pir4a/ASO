import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cart, CartItem } from '../../../domain/entities/cart.entity';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';

@Injectable()
export class MergeGuestCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: CartRepository,
  ) {}

  async execute(userId: string, guestCartId: string): Promise<Cart> {
    // The front-end stores the guest cart owner as a UUID in localStorage and sends it via
    // the x-guest-cart-id header. That value is used as the cart's userId column, so we
    // look up the guest cart by userId first, and fall back to id for legacy cases.
    let guestCart = await this.cartRepository.findByUserId(guestCartId);
    if (!guestCart) {
      guestCart = await this.cartRepository.findById(guestCartId);
    }
    if (!guestCart || guestCart.status !== 'active') {
      // Nothing to merge; return (or create) the user's own cart unchanged.
      const existing = await this.cartRepository.findByUserId(userId);
      if (existing) return existing;
      return this.cartRepository.create(new Cart({ userId, items: [] }));
    }

    const userCart = await this.cartRepository.findByUserId(userId);

    if (!userCart) {
      // No existing user cart, just reassign guest cart to user
      guestCart.userId = userId;
      return this.cartRepository.update(guestCart);
    }

    // Merge items: combine quantities for same products
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        (item) => item.productId === guestItem.productId,
      );
      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        userCart.items.push(
          new CartItem({
            ...guestItem,
            cartId: userCart.id,
          }),
        );
      }
    }

    // Mark guest cart as merged
    guestCart.status = 'merged';
    await this.cartRepository.update(guestCart);

    return this.cartRepository.update(userCart);
  }
}
