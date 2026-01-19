import { Order as DomainOrder, OrderItem as DomainOrderItem } from '../../../../domain/entities/order.entity';
import { Order as TypeOrmOrder } from '../entities/order.entity';
import { OrderItem as TypeOrmOrderItem } from '../entities/order-item.entity';
import { Address as DomainAddress } from '../../../../domain/entities/address.entity';

export class OrderMapper {
    static toDomain(entity: TypeOrmOrder): DomainOrder {
        return new DomainOrder({
            id: entity.id,
            userId: entity.userId,
            status: entity.status,
            total: Number(entity.total),
            currency: entity.currency,
            shippingAddress: new DomainAddress(entity.shippingAddress),
            billingAddress: entity.billingAddress ? new DomainAddress(entity.billingAddress) : undefined,
            paymentMethod: entity.paymentMethod,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            items: entity.items ? entity.items.map(item => new DomainOrderItem({
                id: item.id,
                orderId: item.orderId,
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                quantity: item.quantity,
                price: Number(item.price),
                currency: item.currency
            })) : [],
        });
    }

    static toPersistence(domain: DomainOrder): TypeOrmOrder {
        const entity = new TypeOrmOrder();
        entity.id = domain.id;
        entity.userId = domain.userId;
        entity.status = domain.status;
        entity.total = domain.total;
        entity.currency = domain.currency;
        entity.shippingAddress = domain.shippingAddress; // JSONB stores object directly
        entity.billingAddress = domain.billingAddress;
        entity.paymentMethod = domain.paymentMethod;
        return entity;
    }
}
