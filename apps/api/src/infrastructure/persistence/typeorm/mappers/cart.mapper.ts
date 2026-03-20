import { Cart as DomainCart, CartItem as DomainCartItem } from '../../../../domain/entities/cart.entity';
import { Cart as TypeOrmCart } from '../entities/cart.entity';
import { CartItem as TypeOrmCartItem } from '../entities/cart-item.entity';

export class CartMapper {
    static toDomain(entity: TypeOrmCart): DomainCart {
        return new DomainCart({
            id: entity.id,
            userId: entity.userId,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            items: entity.items ? entity.items.map(item => new DomainCartItem({
                id: item.id,
                cartId: item.cartId,
                productId: item.productId,
                quantity: item.quantity,
                priceAtAdd: Number(item.priceAtAdd) || undefined,
                productName: item.product?.name,
                productSlug: item.product?.slug,
                productThumbnailUrl: item.product?.thumbnailUrl,
                productPrice: Number(item.product?.price),
                productCurrency: item.product?.currency,
            })) : [],
        });
    }

    static toPersistence(domain: DomainCart): TypeOrmCart {
        const entity = new TypeOrmCart();
        entity.id = domain.id;
        entity.userId = domain.userId;
        entity.status = domain.status;
        // Items are usually handled separately or via cascade, but here's the mapping logic if needed
        return entity;
    }
}
