import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';
import { resolveStockNotifyEmail } from './stock-notify-email';

type JwtUser = { sub: string; email: string };

@Injectable()
export class GetProductStockNotifyStatusUseCase {
  constructor(
    @InjectRepository(ProductStockNotification)
    private readonly notifications: Repository<ProductStockNotification>,
  ) {}

  async execute(input: {
    productId: string;
    emailFromBody?: string;
    emailFromQuery?: string;
    user?: JwtUser;
  }): Promise<{ subscribed: boolean }> {
    const email = resolveStockNotifyEmail(input);
    if (!email) throw new BadRequestException('EMAIL_REQUIRED');

    const existing = await this.notifications.findOne({
      where: { productId: input.productId, email },
    });
    return { subscribed: !!existing };
  }
}
