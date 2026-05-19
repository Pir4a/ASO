import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';
import { resolveStockNotifyEmail } from './stock-notify-email';

type JwtUser = { sub: string; email: string };

@Injectable()
export class UnsubscribeProductStockNotifyUseCase {
  constructor(
    @InjectRepository(ProductStockNotification)
    private readonly notifications: Repository<ProductStockNotification>,
  ) {}

  async execute(input: {
    productId: string;
    emailFromBody?: string;
    user?: JwtUser;
  }): Promise<{ ok: true; removed: boolean }> {
    const email = resolveStockNotifyEmail(input);
    if (!email) throw new BadRequestException('EMAIL_REQUIRED');

    const result = await this.notifications.delete({
      productId: input.productId,
      email,
    });
    return { ok: true, removed: (result.affected ?? 0) > 0 };
  }
}
