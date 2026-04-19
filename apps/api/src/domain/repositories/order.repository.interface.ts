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

export interface OrderRepository {
    findAllByUserId(userId: string): Promise<Order[]>;
    findByUserIdWithFilters(userId: string, filters: OrderFilters): Promise<Order[]>;
    findOneByIdAndUserId(id: string, userId: string): Promise<Order | null>;
    findById(id: string): Promise<Order | null>;
    create(order: Order): Promise<Order>;
    update(order: Order): Promise<Order>;
    updateStatus(id: string, status: string, metadata?: Record<string, any>): Promise<Order>;
    findAllForAdmin(params: {
        skip: number;
        take: number;
        status?: string;
    }): Promise<{ rows: { order: Order; customerEmail: string | null }[]; total: number }>;
    getAdminDashboard(): Promise<AdminDashboardSnapshot>;
}

export const ORDER_REPOSITORY_TOKEN = 'OrderRepository';

