import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { AddToCartUseCase } from '../../application/use-cases/cart/add-to-cart.use-case';
import { GetCartUseCase } from '../../application/use-cases/cart/get-cart.use-case';
import { UpdateCartItemUseCase } from '../../application/use-cases/cart/update-cart-item.use-case';
import { RemoveFromCartUseCase } from '../../application/use-cases/cart/remove-from-cart.use-case';
import { MergeGuestCartUseCase } from '../../application/use-cases/cart/merge-guest-cart.use-case';
import { ApplyPromotionUseCase } from '../../application/use-cases/cart/apply-promotion.use-case';

@Controller('cart')
export class CartController {
    constructor(
        private readonly addToCartUseCase: AddToCartUseCase,
        private readonly getCartUseCase: GetCartUseCase,
        private readonly updateCartItemUseCase: UpdateCartItemUseCase,
        private readonly removeFromCartUseCase: RemoveFromCartUseCase,
        private readonly mergeGuestCartUseCase: MergeGuestCartUseCase,
        private readonly applyPromotionUseCase: ApplyPromotionUseCase,
    ) { }

    @Get()
    async getCart(@Request() req: any) {
        const userId = req.user?.id || req.headers['x-guest-cart-id'] || 'guest-user-id';
        return this.getCartUseCase.execute(userId);
    }

    @Post('items')
    async addToCart(@Body() body: { userId?: string; productId: string; quantity: number }, @Request() req: any) {
        const userId = body.userId || req.user?.id || req.headers['x-guest-cart-id'] || 'guest-user-id';
        return this.addToCartUseCase.execute(userId, body.productId, body.quantity);
    }

    @Put('items/:productId')
    async updateCartItem(
        @Param('productId') productId: string,
        @Body() body: { quantity: number },
        @Request() req: any
    ) {
        const userId = req.user?.id || req.headers['x-guest-cart-id'] || 'guest-user-id';
        return this.updateCartItemUseCase.execute(userId, productId, body.quantity);
    }

    @Delete('items/:productId')
    async removeCartItem(@Param('productId') productId: string, @Request() req: any) {
        const userId = req.user?.id || req.headers['x-guest-cart-id'] || 'guest-user-id';
        return this.removeFromCartUseCase.execute(userId, productId);
    }

    @Post('merge')
    async mergeGuestCart(@Body() body: { guestCartId: string }, @Request() req: any) {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error('Must be logged in to merge carts');
        }
        return this.mergeGuestCartUseCase.execute(userId, body.guestCartId);
    }

    @Post('promo')
    async applyPromoCode(@Body() body: { code: string; orderTotal: number }) {
        return this.applyPromotionUseCase.execute(body.code, body.orderTotal);
    }
}
