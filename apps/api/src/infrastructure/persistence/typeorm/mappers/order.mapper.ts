import { Order as DomainOrder, OrderItem as DomainOrderItem } from '../../../../domain/entities/order.entity';
import { Order as TypeOrmOrder } from '../entities/order.entity';
import { OrderItem as TypeOrmOrderItem } from '../entities/order-item.entity';
import { Address as DomainAddress } from '../../../../domain/entities/address.entity';

export class OrderMapper {
    static toDomain(entity: TypeOrmOrder): DomainOrder {
        return new DomainOrder({
            id: entity.id,
            orderNumber: entity.orderNumber ?? null,
            // The DB stores null for guest orders that haven't been claimed
            // yet; the domain treats '' as the guest sentinel.
            userId: entity.userId ?? '',
            status: entity.status,
            total: Number(entity.total),
            promotionCode: entity.promotionCode ?? null,
            discountAmount:
                entity.discountAmount !== null && entity.discountAmount !== undefined
                    ? Number(entity.discountAmount)
                    : null,
            currency: entity.currency,
            shippingAddress: new DomainAddress(entity.shippingAddress),
            billingAddress: entity.billingAddress ? new DomainAddress(entity.billingAddress) : undefined,
            paymentMethod: entity.paymentMethod,
            paymentId: entity.paymentId,
            paymentMethodId: entity.paymentMethodId,
            paymentBrand: entity.paymentBrand,
            paymentLast4: entity.paymentLast4,
            paymentStatus: entity.paymentStatus,
            paidAt: entity.paidAt ?? null,
            statusHistory: entity.statusHistory ?? undefined,
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
        entity.orderNumber = domain.orderNumber ?? null;
        // Map the '' guest sentinel back to null so Postgres accepts the row.
        entity.userId = domain.userId ? domain.userId : null;
        entity.status = domain.status;
        entity.total = domain.total;
        entity.promotionCode = domain.promotionCode ?? null;
        entity.discountAmount = domain.discountAmount ?? null;
        entity.currency = domain.currency;
        entity.shippingAddress = domain.shippingAddress; // JSONB stores object directly
        entity.billingAddress = domain.billingAddress;
        entity.paymentMethod = domain.paymentMethod;
        entity.paymentId = domain.paymentId;
        entity.paymentMethodId = domain.paymentMethodId;
        entity.paymentBrand = domain.paymentBrand;
        entity.paymentLast4 = domain.paymentLast4;
        entity.paymentStatus = domain.paymentStatus ?? 'unpaid';
        entity.paidAt = domain.paidAt ?? null;
        entity.statusHistory = domain.statusHistory;
        return entity;
    }
}
