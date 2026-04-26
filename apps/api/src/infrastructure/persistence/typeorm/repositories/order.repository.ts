import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order as TypeOrmOrder } from '../entities/order.entity';
import { OrderItem as TypeOrmOrderItem } from '../entities/order-item.entity';
import { Order as DomainOrder } from '../../../../domain/entities/order.entity';
import {
  OrderRepository,
  OrderFilters,
  type AdminDashboardSnapshot,
} from '../../../../domain/repositories/order.repository.interface';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  private readonly repository: Repository<TypeOrmOrder>;
  private readonly itemRepository: Repository<TypeOrmOrderItem>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmOrder);
    this.itemRepository = dataSource.getRepository(TypeOrmOrderItem);
  }

  async findAllByUserId(userId: string): Promise<DomainOrder[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['items'],
    });
    return entities.map((e) => OrderMapper.toDomain(e));
  }

  async findByUserIdWithFilters(
    userId: string,
    filters: OrderFilters,
  ): Promise<DomainOrder[]> {
    const qb = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    if (filters.year) {
      qb.andWhere('EXTRACT(YEAR FROM order.createdAt) = :year', {
        year: filters.year,
      });
    }

    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.search) {
      qb.andWhere(
        '(order.id::text ILIKE :search OR EXISTS (SELECT 1 FROM order_items oi WHERE oi."orderId" = order.id AND oi."productName" ILIKE :search))',
        { search: `%${filters.search}%` },
      );
    }

    const entities = await qb.getMany();
    return entities.map((e) => OrderMapper.toDomain(e));
  }

  async findOneByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<DomainOrder | null> {
    const entity = await this.repository.findOne({
      where: { id, userId },
      relations: ['items'],
    });
    if (!entity) return null;
    return OrderMapper.toDomain(entity);
  }

  async findById(id: string): Promise<DomainOrder | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!entity) return null;
    return OrderMapper.toDomain(entity);
  }

  async create(order: DomainOrder): Promise<DomainOrder> {
    const persistenceEntity = OrderMapper.toPersistence(order);
    const newEntity = await this.repository.save(persistenceEntity);

    if (order.items && order.items.length > 0) {
      const items = order.items.map((item) => {
        const i = new TypeOrmOrderItem();
        i.orderId = newEntity.id;
        i.productId = item.productId;
        i.productName = item.productName;
        i.productSku = item.productSku;
        i.quantity = item.quantity;
        i.price = item.price;
        i.currency = item.currency;
        return i;
      });
      await this.itemRepository.save(items);
      newEntity.items = items;
    }

    return OrderMapper.toDomain(newEntity);
  }

  async update(order: DomainOrder): Promise<DomainOrder> {
    const persistenceEntity = OrderMapper.toPersistence(order);
    const savedEntity = await this.repository.save(persistenceEntity);
    return OrderMapper.toDomain(savedEntity);
  }

  async updateStatus(
    id: string,
    status: string,
    metadata?: Record<string, any>,
  ): Promise<DomainOrder> {
    const order = await this.repository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new Error('Order not found');

    const prev = order.status;
    if (prev !== status) {
      const hist = Array.isArray(order.statusHistory)
        ? [...order.statusHistory]
        : [];
      hist.push({
        status: status as TypeOrmOrder['status'],
        at: new Date().toISOString(),
      });
      order.statusHistory = hist;
    }
    order.status = status as TypeOrmOrder['status'];

    if (metadata) {
      const m = metadata as {
        paymentId?: string;
        paymentStatus?: string;
        paymentMethod?: string;
        paymentMethodId?: string;
        paymentBrand?: string;
        paymentLast4?: string;
      };
      if (m.paymentId) order.paymentId = m.paymentId;
      if (m.paymentStatus) order.paymentStatus = m.paymentStatus;
      if (m.paymentMethod) order.paymentMethod = m.paymentMethod;
      if (m.paymentMethodId) order.paymentMethodId = m.paymentMethodId;
      if (m.paymentBrand) order.paymentBrand = m.paymentBrand;
      if (m.paymentLast4) order.paymentLast4 = m.paymentLast4;
    }

    const savedEntity = await this.repository.save(order);
    return OrderMapper.toDomain(savedEntity);
  }

  async findAllForAdmin(params: {
    skip: number;
    take: number;
    status?: string;
  }): Promise<{
    rows: { order: DomainOrder; customerEmail: string | null }[];
    total: number;
  }> {
    const qb = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC')
      .skip(params.skip)
      .take(params.take);
    if (params.status) {
      qb.andWhere('order.status = :st', { st: params.status });
    }
    const [entities, total] = await qb.getManyAndCount();
    if (entities.length === 0) {
      return { rows: [], total };
    }
    const userIds = [...new Set(entities.map((e) => e.userId))];
    const rawEmails: unknown = await this.repository.manager.query(
      `SELECT id, email FROM users WHERE id = ANY($1::uuid[])`,
      [userIds],
    );
    const emailRows = Array.isArray(rawEmails)
      ? (rawEmails as { id: string; email: string }[])
      : [];
    const mail = new Map(emailRows.map((r) => [r.id, r.email]));
    return {
      rows: entities.map((e) => ({
        order: OrderMapper.toDomain(e),
        customerEmail: e.userId ? mail.get(e.userId) ?? null : null,
      })),
      total,
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardSnapshot> {
    const rq = async <T>(sql: string, params?: unknown[]): Promise<T> => {
      const rows: unknown = await this.repository.manager.query(sql, params);
      return rows as T;
    };

    const [todayRows, yesterdayRows] = await Promise.all([
      rq<{ revenue: string; orders: string }[]>(
        `SELECT COALESCE(SUM(o.total), 0)::float AS revenue, COUNT(*)::int AS orders
         FROM orders o
         WHERE o."createdAt"::date = CURRENT_DATE AND o.status <> 'cancelled'`,
      ),
      rq<{ revenue: string; orders: string }[]>(
        `SELECT COALESCE(SUM(o.total), 0)::float AS revenue, COUNT(*)::int AS orders
         FROM orders o
         WHERE o."createdAt"::date = CURRENT_DATE - 1 AND o.status <> 'cancelled'`,
      ),
    ]);
    const today = todayRows[0] ?? {
      revenue: '0',
      orders: '0',
    };
    const yesterday = yesterdayRows[0] ?? {
      revenue: '0',
      orders: '0',
    };

    const dailyRows = await rq<
      { d: string; revenue: string; orders: string }[]
    >(
      `SELECT o."createdAt"::date::text AS d,
              COALESCE(SUM(o.total), 0)::float AS revenue,
              COUNT(*)::int AS orders
       FROM orders o
       WHERE o."createdAt"::date >= CURRENT_DATE - INTERVAL '6 days'
         AND o.status <> 'cancelled'
       GROUP BY o."createdAt"::date
       ORDER BY d ASC`,
    );

    const weekRows = await rq<{ w: string; revenue: string; orders: string }[]>(
      `SELECT date_trunc('week', o."createdAt")::date::text AS w,
              COALESCE(SUM(o.total), 0)::float AS revenue,
              COUNT(*)::int AS orders
       FROM orders o
       WHERE o."createdAt" >= date_trunc('week', CURRENT_TIMESTAMP) - INTERVAL '4 weeks'
         AND o.status <> 'cancelled'
       GROUP BY date_trunc('week', o."createdAt")
       ORDER BY w ASC`,
    );

    const statusRows = await rq<{ status: string; cnt: string; rev: string }[]>(
      `SELECT o.status,
              COUNT(*)::int AS cnt,
              COALESCE(SUM(o.total), 0)::float AS rev
       FROM orders o
       WHERE o."createdAt"::date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY o.status`,
    );

    const catRows = await rq<{ name: string; revenue: string }[]>(
      `SELECT c.name,
              SUM(oi.price * oi.quantity)::float AS revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi."orderId"
       INNER JOIN products p ON p.id = oi."productId"
       INNER JOIN categories c ON c.id = p."categoryId"
       WHERE o."createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
         AND o.status <> 'cancelled'
       GROUP BY c.id, c.name
       ORDER BY revenue DESC
       LIMIT 12`,
    );

    const days: string[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const byDay = new Map(
      dailyRows.map((r) => [
        r.d,
        {
          revenue: Number(r.revenue),
          orders: Number.parseInt(r.orders, 10) || 0,
        },
      ]),
    );
    const salesByDay = days.map((date) => ({
      date,
      revenue: byDay.get(date)?.revenue ?? 0,
      orders: byDay.get(date)?.orders ?? 0,
    }));

    const weeklyRevenue = weekRows.map((r) => ({
      weekStart: r.w,
      revenue: Number(r.revenue),
      orders: Number.parseInt(r.orders, 10) || 0,
    }));

    const statusMix7d = statusRows.map((r) => ({
      status: r.status,
      count: Number.parseInt(r.cnt, 10) || 0,
      revenue: Number(r.rev),
    }));

    const categoryShare30d = catRows.map((r) => ({
      categoryName: r.name,
      revenue: Number(r.revenue),
    }));

    return {
      kpi: {
        revenueToday: Number(today?.revenue ?? 0),
        ordersToday: Number.parseInt(String(today?.orders ?? 0), 10) || 0,
        revenueYesterday: Number(yesterday?.revenue ?? 0),
        ordersYesterday:
          Number.parseInt(String(yesterday?.orders ?? 0), 10) || 0,
      },
      salesByDay,
      weeklyRevenue,
      statusMix7d,
      categoryShare30d,
    };
  }
}
