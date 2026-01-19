import { Inject, Injectable } from '@nestjs/common';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY_TOKEN } from '../../../domain/repositories/cart.repository.interface';
import { Cart } from '../../../domain/entities/cart.entity';

@Injectable()
export class GetCartUseCase {
    constructor(
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: CartRepository,
    ) { }

    async execute(userId: string): Promise<Cart | null> {
        return this.cartRepository.findByUserId(userId);
    }
}
