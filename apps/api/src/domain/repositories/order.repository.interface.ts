import { Order } from '../entities/order.entity';

export interface AdminDashboardSnapshot {
    kpi: {
        revenueToday: number;
        ordersToday: number;
        revenueYesterday: number;
        ordersYesterday: number;
    };
    salesByDay: { date: string; revenue: number; orders: number }[];
    weeklyRevenue: { weekStart: string; revenue: number; orders: number }[];
    statusMix7d: { status: string; count: number; revenue: number }[];
    categoryShare30d: { categoryName: string; revenue: number }[];
}

export interface OrderFilters {
    year?: number;
    status?: string;
    search?: string;
}

export interface UpdateOrderStatusMetadata {
    paymentId?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paymentMethodId?: string;
    paymentBrand?: string;
    paymentLast4?: string;
    paidAt?: Date;
    byUserId?: string | null;
    byEmail?: string | null;
}

export interface AdminOrderListFilters {
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
}

// CDC §XVI — admin orders table supports clicking any column header to sort.
export type AdminOrderSortField =
    | 'orderNumber'
    | 'createdAt'
    | 'customerEmail'
    | 'total';

export interface AdminOrderSort {
    field: AdminOrderSortField;
    direction: 'asc' | 'desc';
}

export interface OrderRepository {
    findAllByUserId(userId: string): Promise<Order[]>;
    findByUserIdWithFilters(userId: string, filters: OrderFilters): Promise<Order[]>;
    findOneByIdAndUserId(id: string, userId: string): Promise<Order | null>;
    findById(id: string): Promise<Order | null>;
    create(order: Order): Promise<Order>;
    update(order: Order): Promise<Order>;
    updateStatus(id: string, status: string, metadata?: UpdateOrderStatusMetadata): Promise<Order>;
    findAllForAdmin(params: {
        skip: number;
        take: number;
        filters?: AdminOrderListFilters;
        sort?: AdminOrderSort;
    }): Promise<{ rows: { order: Order; customerEmail: string | null }[]; total: number }>;
    getAdminDashboard(): Promise<AdminDashboardSnapshot>;
    /** Per-customer aggregations for the BO users table (#12). */
    getCustomerStats(
        userIds: string[],
    ): Promise<Map<string, { orderCount: number; revenue: number }>>;
    /** Revenue by category for #16 camembert. */
    getSalesByCategory(
        period: '7d' | '5w',
    ): Promise<{ categoryId: string; name: string; revenue: number }[]>;
    /** Avg cart value per category by day (7d) or week (5w) for #15. */
    getAvgCartByCategory(
        period: '7d' | '5w',
    ): Promise<{
        buckets: { date: string; byCategory: Record<string, number> }[];
        categories: { id: string; name: string }[];
    }>;
}

export const ORDER_REPOSITORY_TOKEN = 'OrderRepository';

