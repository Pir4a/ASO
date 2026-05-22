import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
  ORDER_REPOSITORY_TOKEN,
  type OrderRepository,
} from '../../../domain/repositories/order.repository.interface';
import {
  USER_REPOSITORY_TOKEN,
  type UserRepository,
} from '../../../domain/repositories/user.repository.interface';
import type { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { formatOrderNumber } from '../../../application/use-cases/orders/get-order-details.use-case';
import { CreateAdminOrderUseCase } from '../../../application/use-cases/orders/create-admin-order.use-case';
import type { GuestAddressInput } from '../../../application/use-cases/orders/create-order.use-case';
import {
  ADDRESS_REPOSITORY_TOKEN,
  type AddressRepository,
} from '../../../domain/repositories/address.repository.interface';
import { GetUsersUseCase } from '../../../application/use-cases/users/get-users.use-case';
import { buildCsv } from '../../../lib/csv';

interface AuthedRequest {
  user?: { sub?: string };
}

class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
  status!: OrderStatus;
}

class CreateAdminOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateAdminOrderAddressDto implements GuestAddressInput {
  @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) street!: string;
  @IsOptional() @IsString() @MaxLength(200) address2?: string;
  @IsString() @IsNotEmpty() @MaxLength(120) city!: string;
  @IsOptional() @IsString() @MaxLength(120) region?: string;
  @IsString() @IsNotEmpty() @MaxLength(20) postalCode!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) country!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

class CreateAdminOrderDto {
  @IsUUID()
  customerId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateAdminOrderItemDto)
  items!: CreateAdminOrderItemDto[];

  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAdminOrderAddressDto)
  address?: CreateAdminOrderAddressDto;

  @IsOptional()
  @IsBoolean()
  markAsPaid?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  paymentMethod?: string;
}

@ApiTags('Orders (admin)')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
    @Inject(ADDRESS_REPOSITORY_TOKEN)
    private readonly addressRepository: AddressRepository,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly createAdminOrderUseCase: CreateAdminOrderUseCase,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return this.orderRepository.getAdminDashboard();
  }

  /** #16 — pie-chart sales by category. */
  @Get('dashboard/sales-by-category')
  async salesByCategory(@Query('period') periodStr?: string) {
    const period = periodStr === '5w' ? '5w' : '7d';
    const rows = await this.orderRepository.getSalesByCategory(period);
    const total = rows.reduce((sum, r) => sum + r.revenue, 0);
    return {
      period,
      total,
      data: rows.map((r) => ({
        categoryId: r.categoryId,
        name: r.name,
        revenue: r.revenue,
        percentage: total > 0 ? Number(((r.revenue / total) * 100).toFixed(2)) : 0,
      })),
    };
  }

  /** #15 — avg cart per category, bucketed by day (7d) or week (5w). */
  @Get('dashboard/avg-cart')
  async avgCart(@Query('period') periodStr?: string) {
    const period = periodStr === '5w' ? '5w' : '7d';
    const result = await this.orderRepository.getAvgCartByCategory(period);
    return { period, ...result };
  }

  @Get('orders')
  async listOrders(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('sort') sortField?: string,
    @Query('dir') sortDir?: string,
  ) {
    const page = Math.max(1, Number.parseInt(pageStr ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitStr ?? '25', 10) || 25),
    );
    const skip = (page - 1) * limit;
    // CDC §XVI — admin clicks any column header to sort. Whitelist the field
    // so we never inject arbitrary SQL through the order-by clause.
    const allowedSort = ['orderNumber', 'createdAt', 'customerEmail', 'total'] as const;
    type SortField = (typeof allowedSort)[number];
    const sort: { field: SortField; direction: 'asc' | 'desc' } | undefined =
      sortField && (allowedSort as readonly string[]).includes(sortField)
        ? {
            field: sortField as SortField,
            direction: sortDir === 'asc' ? 'asc' : 'desc',
          }
        : undefined;
    const { rows, total } = await this.orderRepository.findAllForAdmin({
      skip,
      take: limit,
      filters: {
        status: status?.trim() || undefined,
        paymentMethod: paymentMethod?.trim() || undefined,
        paymentStatus: paymentStatus?.trim() || undefined,
      },
      sort,
    });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: rows.map((r) => ({
        id: r.order.id,
        orderNumber: r.order.orderNumber ?? formatOrderNumber(r.order.id, r.order.createdAt),
        userId: r.order.userId,
        status: r.order.status,
        total: r.order.total,
        currency: r.order.currency,
        paymentMethod: r.order.paymentMethod ?? null,
        paymentStatus: r.order.paymentStatus,
        paidAt: r.order.paidAt ?? null,
        paymentBrand: r.order.paymentBrand ?? null,
        paymentLast4: r.order.paymentLast4 ?? null,
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

  /** #17 — admin creates an order on behalf of a customer (manual / phone / email channel). */
  @Post('orders')
  async createOrder(@Body() body: CreateAdminOrderDto, @Request() req: AuthedRequest) {
    const adminId = req.user?.sub ?? null;
    if (!adminId) throw new NotFoundException('Authenticated admin required.');
    let adminEmail: string | null = null;
    try {
      const admin = await this.userRepository.findById(adminId);
      adminEmail = admin?.email ?? null;
    } catch {
      adminEmail = null;
    }
    const order = await this.createAdminOrderUseCase.execute({
      customerId: body.customerId,
      items: body.items,
      addressId: body.addressId,
      address: body.address,
      adminId,
      adminEmail: adminEmail ?? '',
      markAsPaid: body.markAsPaid ?? false,
      paymentMethod: body.paymentMethod,
    });
    return serializeOrder(order);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
    @Request() req: AuthedRequest,
  ) {
    const existing = await this.orderRepository.findById(id);
    if (!existing) throw new NotFoundException('Commande introuvable.');
    if (existing.status === body.status) {
      return serializeOrder(existing);
    }

    // Attribute the change to the admin who made it (CDC §XVI.11).
    let actorEmail: string | null = null;
    const actorId = req.user?.sub ?? null;
    if (actorId) {
      try {
        const actor = await this.userRepository.findById(actorId);
        actorEmail = actor?.email ?? null;
      } catch {
        actorEmail = null;
      }
    }

    const updated = await this.orderRepository.updateStatus(id, body.status, {
      byUserId: actorId,
      byEmail: actorEmail,
    });
    return serializeOrder(updated);
  }

  /** #26 — exports the filtered orders list as a CSV. */
  @Get('orders/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  async exportOrdersCsv(
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    // Take a generous slice — exports are admin-only and the catalogue size
    // tolerates this. Switch to streaming if the dataset grows.
    const { rows } = await this.orderRepository.findAllForAdmin({
      skip: 0,
      take: 5000,
      filters: {
        status: status?.trim() || undefined,
        paymentMethod: paymentMethod?.trim() || undefined,
        paymentStatus: paymentStatus?.trim() || undefined,
      },
    });
    return buildCsv(rows, [
      { header: 'orderNumber', value: (r) => r.order.orderNumber ?? formatOrderNumber(r.order.id, r.order.createdAt) },
      { header: 'customerEmail', value: (r) => r.customerEmail ?? '' },
      { header: 'status', value: (r) => r.order.status },
      { header: 'paymentStatus', value: (r) => r.order.paymentStatus ?? '' },
      { header: 'paymentMethod', value: (r) => r.order.paymentMethod ?? '' },
      { header: 'paymentBrand', value: (r) => r.order.paymentBrand ?? '' },
      { header: 'paymentLast4', value: (r) => r.order.paymentLast4 ?? '' },
      { header: 'total', value: (r) => Number(r.order.total).toFixed(2) },
      { header: 'currency', value: (r) => r.order.currency },
      { header: 'lineCount', value: (r) => r.order.items?.length ?? 0 },
      { header: 'paidAt', value: (r) => (r.order.paidAt ? new Date(r.order.paidAt).toISOString() : '') },
      { header: 'createdAt', value: (r) => new Date(r.order.createdAt).toISOString() },
    ]);
  }

  /** #26 — exports the users list (with revenue + order count) as a CSV. */
  @Get('users/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  async exportUsersCsv() {
    const users = await this.getUsersUseCase.execute();
    const ids = users.map((u) => u.id);
    const stats = await this.orderRepository.getCustomerStats(ids);
    const addressCounts = await Promise.all(
      ids.map(async (id) => [id, (await this.addressRepository.findAllByUserId(id)).length] as const),
    );
    const addressMap = new Map(addressCounts);
    return buildCsv(users, [
      { header: 'email', value: (u) => u.email },
      { header: 'fullName', value: (u) => [u.firstName, u.lastName].filter(Boolean).join(' ').trim() },
      { header: 'role', value: (u) => u.role },
      { header: 'isVerified', value: (u) => (u.isVerified ? 'true' : 'false') },
      { header: 'isActive', value: (u) => (u.isActive === false ? 'false' : 'true') },
      { header: 'createdAt', value: (u) => (u.createdAt ? new Date(u.createdAt).toISOString() : '') },
      { header: 'lastLoginAt', value: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : '') },
      { header: 'orderCount', value: (u) => stats.get(u.id)?.orderCount ?? 0 },
      { header: 'revenue', value: (u) => (stats.get(u.id)?.revenue ?? 0).toFixed(2) },
      { header: 'addressCount', value: (u) => addressMap.get(u.id) ?? 0 },
    ]);
  }
}

function serializeOrder(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber ?? formatOrderNumber(order.id, order.createdAt),
    userId: order.userId,
    status: order.status,
    total: order.total,
    currency: order.currency,
    paymentMethod: order.paymentMethod ?? null,
    paymentId: order.paymentId,
    paymentStatus: order.paymentStatus,
    paidAt: order.paidAt ?? null,
    paymentBrand: order.paymentBrand ?? null,
    paymentLast4: order.paymentLast4 ?? null,
    statusHistory: order.statusHistory ?? [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    items: order.items,
  };
}
