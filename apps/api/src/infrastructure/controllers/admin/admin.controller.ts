import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
  ORDER_REPOSITORY_TOKEN,
  type OrderRepository,
} from '../../../domain/repositories/order.repository.interface';
import type { Order, OrderStatus } from '../../../domain/entities/order.entity';

class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
  status!: OrderStatus;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return this.orderRepository.getAdminDashboard();
  }

  @Get('orders')
  async listOrders(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status') status?: string,
  ) {
    const page = Math.max(1, Number.parseInt(pageStr ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitStr ?? '25', 10) || 25),
    );
    const skip = (page - 1) * limit;
    const { rows, total } = await this.orderRepository.findAllForAdmin({
      skip,
      take: limit,
      status: status?.trim() || undefined,
    });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: rows.map((r) => ({
        id: r.order.id,
        userId: r.order.userId,
        status: r.order.status,
        total: r.order.total,
        currency: r.order.currency,
        paymentStatus: r.order.paymentStatus,
        createdAt: r.order.createdAt,
        updatedAt: r.order.updatedAt,
        customerEmail: r.customerEmail,
        lineCount: r.order.items?.length ?? 0,
      })),
      meta: { total, page, pageSize: limit, totalPages },
    };
  }

  @Get('orders/:id')
  async orderDetail(@Param('id') id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Commande introuvable.');
    return serializeOrder(order);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    const existing = await this.orderRepository.findById(id);
    if (!existing) throw new NotFoundException('Commande introuvable.');
    if (existing.status === body.status) {
      return serializeOrder(existing);
    }
    const updated = await this.orderRepository.updateStatus(id, body.status);
    return serializeOrder(updated);
  }
}

function serializeOrder(order: Order) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentId: order.paymentId,
    paymentStatus: order.paymentStatus,
    statusHistory: order.statusHistory ?? [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    items: order.items,
  };
}
