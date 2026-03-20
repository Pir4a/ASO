import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Cart as TypeOrmCart } from '../entities/cart.entity';
import { CartItem as TypeOrmCartItem } from '../entities/cart-item.entity';
import { Cart as DomainCart, CartItem as DomainCartItem } from '../../../../domain/entities/cart.entity';
import { CartRepository } from '../../../../domain/repositories/cart.repository.interface';
import { CartMapper } from '../mappers/cart.mapper';

@Injectable()
export class TypeOrmCartRepository implements CartRepository {
    private readonly repository: Repository<TypeOrmCart>;
    private readonly itemRepository: Repository<TypeOrmCartItem>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(TypeOrmCart);
        this.itemRepository = dataSource.getRepository(TypeOrmCartItem);
    }

    async findByUserId(userId: string): Promise<DomainCart | null> {
        // Find active cart for user
        const entity = await this.repository.findOne({
            where: { userId, status: 'active' },
            relations: ['items', 'items.product']
        });
        if (!entity) return null;
        return CartMapper.toDomain(entity);
    }

    async findById(id: string): Promise<DomainCart | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['items', 'items.product']
        });
        if (!entity) return null;
        return CartMapper.toDomain(entity);
    }

    async create(cart: DomainCart): Promise<DomainCart> {
        // Note: For complex nested creates with relations, careful handling is needed.
        // Simplified: Create cart then save items.
        const persistenceEntity = CartMapper.toPersistence(cart);
        const newEntity = await this.repository.save(persistenceEntity);

        if (cart.items && cart.items.length > 0) {
            const items = cart.items.map(item => {
                const i = new TypeOrmCartItem();
                i.cartId = newEntity.id;
                i.productId = item.productId;
                i.quantity = item.quantity;
                i.priceAtAdd = item.priceAtAdd;
                return i;
            });
            await this.itemRepository.save(items);
            newEntity.items = items;
        }

        return CartMapper.toDomain(newEntity);
    }

    async update(cart: DomainCart): Promise<DomainCart> {
        const persistenceEntity = CartMapper.toPersistence(cart);

        // Save cart entity first
        await this.repository.save(persistenceEntity);

        // Handle cart items: Delete existing items and recreate
        // This ensures we have a clean sync of items
        await this.itemRepository.delete({ cartId: cart.id });

        if (cart.items && cart.items.length > 0) {
            const items = cart.items.map(item => {
                const i = new TypeOrmCartItem();
                i.id = item.id;
                i.cartId = cart.id;
                i.productId = item.productId;
                i.quantity = item.quantity;
                i.priceAtAdd = item.priceAtAdd;
                return i;
            });
            await this.itemRepository.save(items);
        }

        // Re-fetch to get items with product relations
        return (await this.findById(cart.id))!;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
