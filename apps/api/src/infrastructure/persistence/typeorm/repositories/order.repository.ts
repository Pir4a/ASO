import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order as TypeOrmOrder } from '../entities/order.entity';
import { OrderItem as TypeOrmOrderItem } from '../entities/order-item.entity';
import { Order as DomainOrder } from '../../../../domain/entities/order.entity';
import { OrderRepository } from '../../../../domain/repositories/order.repository.interface';
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
            relations: ['items']
        });
        return entities.map(OrderMapper.toDomain);
    }

    async findById(id: string): Promise<DomainOrder | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['items']
        });
        if (!entity) return null;
        return OrderMapper.toDomain(entity);
    }

    async create(order: DomainOrder): Promise<DomainOrder> {
        const persistenceEntity = OrderMapper.toPersistence(order);
        const newEntity = await this.repository.save(persistenceEntity);

        if (order.items && order.items.length > 0) {
            const items = order.items.map(item => {
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

    async updateStatus(id: string, status: string, metadata?: Record<string, any>): Promise<DomainOrder> {
        const order = await this.repository.findOne({ where: { id }, relations: ['items'] });
        if (!order) throw new Error('Order not found');

        // Cast string status to enum if applicable or ensure type safety
        // Here we assume basic compatibility
        order.status = status as any;

        if (metadata) {
            if (metadata.paymentId) order.paymentId = metadata.paymentId;
            if (metadata.paymentStatus) order.paymentStatus = metadata.paymentStatus;
            if (metadata.paymentMethod) order.paymentMethod = metadata.paymentMethod;
        }

        const savedEntity = await this.repository.save(order);
        return OrderMapper.toDomain(savedEntity);
    }
}
