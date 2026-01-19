import { Order } from '../entities/order.entity';

export interface OrderRepository {
    findAllByUserId(userId: string): Promise<Order[]>;
    findById(id: string): Promise<Order | null>;
    create(order: Order): Promise<Order>;
    update(order: Order): Promise<Order>;
}

export const ORDER_REPOSITORY_TOKEN = 'OrderRepository';
