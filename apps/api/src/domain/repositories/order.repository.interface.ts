import { Order } from '../entities/order.entity';

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
}

export const ORDER_REPOSITORY_TOKEN = 'OrderRepository';

