import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order as TypeOrmOrder } from '../entities/order.entity';
import { OrderItem as TypeOrmOrderItem } from '../entities/order-item.entity';
import { Order as DomainOrder } from '../../../../domain/entities/order.entity';
import { OrderRepository, OrderFilters } from '../../../../domain/repositories/order.repository.interface';
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

    async findByUserIdWithFilters(userId: string, filters: OrderFilters): Promise<DomainOrder[]> {
        const qb = this.repository.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .where('order.userId = :userId', { userId })
            .orderBy('order.createdAt', 'DESC');

        if (filters.year) {
            qb.andWhere('EXTRACT(YEAR FROM order.createdAt) = :year', { year: filters.year });
        }

        if (filters.status) {
            qb.andWhere('order.status = :status', { status: filters.status });
        }

        if (filters.search) {
            qb.andWhere(
                '(order.id::text ILIKE :search OR EXISTS (SELECT 1 FROM order_items oi WHERE oi."orderId" = order.id AND oi."productName" ILIKE :search))',
                { search: `%${filters.search}%` }
            );
        }

        const entities = await qb.getMany();
        return entities.map(OrderMapper.toDomain);
    }

    async findOneByIdAndUserId(id: string, userId: string): Promise<DomainOrder | null> {
        const entity = await this.repository.findOne({
            where: { id, userId },
            relations: ['items']
        });
        if (!entity) return null;
        return OrderMapper.toDomain(entity);
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

