import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AddToCartUseCase } from '../../application/use-cases/cart/add-to-cart.use-case';
import { GetCartUseCase } from '../../application/use-cases/cart/get-cart.use-case';
import { UpdateCartItemUseCase } from '../../application/use-cases/cart/update-cart-item.use-case';
import { RemoveFromCartUseCase } from '../../application/use-cases/cart/remove-from-cart.use-case';
import { MergeGuestCartUseCase } from '../../application/use-cases/cart/merge-guest-cart.use-case';
import { ApplyPromotionUseCase } from '../../application/use-cases/cart/apply-promotion.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveCartOwner(req: {
  user?: { sub?: string };
  headers: Record<string, string | string[] | undefined>;
}): string | null {
  const authUserId = req.user?.sub;
  if (authUserId && UUID_REGEX.test(authUserId)) return authUserId;

  const rawHeader = req.headers['x-guest-cart-id'];
  const guestId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (typeof guestId === 'string' && UUID_REGEX.test(guestId)) return guestId;

  return null;
}

@Controller('cart')
export class CartController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly mergeGuestCartUseCase: MergeGuestCartUseCase,
    private readonly applyPromotionUseCase: ApplyPromotionUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCart(@Request() req: any) {
    const userId = resolveCartOwner(req);
    if (!userId) return { id: null, items: [], status: 'active' };
    const cart = await this.getCartUseCase.execute(userId);
    return cart ?? { id: null, items: [], status: 'active' };
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  async addToCart(
    @Body() body: { productId: string; quantity: number },
    @Request() req: any,
  ) {
    const userId = resolveCartOwner(req);
    if (!userId)
      throw new BadRequestException(
        'Missing cart owner (login or x-guest-cart-id header required).',
      );
    return this.addToCartUseCase.execute(userId, body.productId, body.quantity);
  }

  @Put('items/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async updateCartItem(
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
    @Request() req: any,
  ) {
    const userId = resolveCartOwner(req);
    if (!userId) throw new BadRequestException('Missing cart owner.');
    return this.updateCartItemUseCase.execute(userId, productId, body.quantity);
  }

  @Delete('items/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async removeCartItem(
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    const userId = resolveCartOwner(req);
    if (!userId) throw new BadRequestException('Missing cart owner.');
    return this.removeFromCartUseCase.execute(userId, productId);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async mergeGuestCart(
    @Body() body: { guestCartId: string },
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    if (!userId)
      throw new BadRequestException('Must be logged in to merge carts.');
    return this.mergeGuestCartUseCase.execute(userId, body.guestCartId);
  }

  @Post('promo')
  async applyPromoCode(@Body() body: { code: string; orderTotal: number }) {
    return this.applyPromotionUseCase.execute(body.code, body.orderTotal);
  }
}
