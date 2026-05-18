import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';
import { Product as ProductOrm } from '../../../infrastructure/persistence/typeorm/entities/product.entity';

type JwtUser = { sub: string; email: string };

@Injectable()
export class SubscribeProductStockNotifyUseCase {
  constructor(
    @InjectRepository(ProductStockNotification)
    private readonly notifications: Repository<ProductStockNotification>,
    @InjectRepository(ProductOrm)
    private readonly products: Repository<ProductOrm>,
  ) {}

  async execute(input: {
    productId: string;
    emailFromBody?: string;
    user?: JwtUser;
  }): Promise<{ ok: true; duplicate: boolean }> {
    const product = await this.products.findOne({ where: { id: input.productId } });
    if (!product) throw new NotFoundException('Produit introuvable.');
    const out =
      product.stock <= 0 || product.status === 'out_of_stock';
    if (!out) {
      throw new BadRequestException('PRODUCT_IN_STOCK');
    }

    const emailRaw = input.user?.email ?? input.emailFromBody;
    if (!emailRaw?.trim()) {
      throw new BadRequestException('EMAIL_REQUIRED');
    }
    const email = emailRaw.trim().toLowerCase();
    const userId = input.user?.sub ?? null;

    const existing = await this.notifications.findOne({
      where: { productId: input.productId, email },
    });
    if (existing) return { ok: true, duplicate: true };

    await this.notifications.save(
      this.notifications.create({
        productId: input.productId,
        email,
        userId,
      }),
    );
    return { ok: true, duplicate: false };
  }
}
