import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'pending';
}

@Injectable()
export class GetAdminUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
  ) { }

  async execute(filters: AdminUserFilters = {}) {
    const users = await this.userRepository.findAll();
    const filtered = users.filter(user => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const match = `${user.firstName || ''} ${user.lastName || ''} ${user.email}`.toLowerCase();
        if (!match.includes(term)) return false;
      }
      if (filters.role && user.role !== filters.role) return false;
      if (filters.status === 'active' && user.isActive === false) return false;
      if (filters.status === 'inactive' && user.isActive !== false) return false;
      if (filters.status === 'pending' && user.isVerified) return false;
      return true;
    });

    const enriched = await Promise.all(filtered.map(async user => {
      const orders = await this.orderRepository.findAllByUserId(user.id);
      const totalSpent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const lastOrder = orders[0]?.createdAt;
      return {
        ...user,
        ordersCount: orders.length,
        totalSpent,
        lastOrderAt: lastOrder,
      };
    }));

    return enriched;
  }
}
