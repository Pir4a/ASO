import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';

@Injectable()
export class CountProductStockNotifySubscribersUseCase {
  constructor(
    @InjectRepository(ProductStockNotification)
    private readonly notifications: Repository<ProductStockNotification>,
  ) {}

  async execute(productId: string): Promise<{ count: number }> {
    const count = await this.notifications.count({ where: { productId } });
    return { count };
  }
}
