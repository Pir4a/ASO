import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type {
  OrderRepository,
  OrderFilters,
} from '../../../domain/repositories/order.repository.interface';
import { formatOrderNumber } from './get-order-details.use-case';

export type OrderListItem = Order & { orderNumber: string };

export interface OrdersByYear {
  [year: string]: OrderListItem[];
}

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(userId: string, filters?: OrderFilters): Promise<OrdersByYear> {
    const orders = filters
      ? await this.orderRepository.findByUserIdWithFilters(userId, filters)
      : await this.orderRepository.findAllByUserId(userId);

    const ordersByYear: OrdersByYear = {};
    for (const order of orders) {
      const year = new Date(order.createdAt).getFullYear().toString();
      if (!ordersByYear[year]) {
        ordersByYear[year] = [];
      }
      ordersByYear[year].push(
        Object.assign(order, {
          orderNumber: formatOrderNumber(order.id, order.createdAt),
        }) as OrderListItem,
      );
    }

    return ordersByYear;
  }
}
