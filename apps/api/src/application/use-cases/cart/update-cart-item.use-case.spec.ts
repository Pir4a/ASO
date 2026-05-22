import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateCartItemUseCase } from './update-cart-item.use-case';
import { Cart, CartItem } from '../../../domain/entities/cart.entity';
import { Product } from '../../../domain/entities/product.entity';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';

function buildCartRepo(): jest.Mocked<CartRepository> {
  return {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function buildProductRepo(): jest.Mocked<ProductRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findOneBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFeatured: jest.fn(),
    browse: jest.fn(),
    findRelatedBySlug: jest.fn(),
    search: jest.fn(),
  };
}

function cartWithLine(qty = 2): Cart {
  return new Cart({
    id: 'c1',
    userId: 'user-1',
    status: 'active',
    items: [
      new CartItem({
        id: 'li1',
        cartId: 'c1',
        productId: 'prod-1',
        quantity: qty,
        priceAtAdd: 100,
      }),
    ],
  });
}

describe('UpdateCartItemUseCase', () => {
  let cartRepository: jest.Mocked<CartRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let useCase: UpdateCartItemUseCase;

  beforeEach(() => {
    cartRepository = buildCartRepo();
    productRepository = buildProductRepo();
    useCase = new UpdateCartItemUseCase(cartRepository, productRepository);
    cartRepository.update.mockImplementation((c) => Promise.resolve(c));
  });

  it('throws NotFoundException when the cart does not exist', async () => {
    cartRepository.findByUserId.mockResolvedValue(null);
    await expect(useCase.execute('user-1', 'prod-1', 3)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the product is not in the cart', async () => {
    cartRepository.findByUserId.mockResolvedValue(cartWithLine());
    await expect(useCase.execute('user-1', 'other', 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removes the line when quantity ≤ 0', async () => {
    cartRepository.findByUserId.mockResolvedValue(cartWithLine());
    const result = await useCase.execute('user-1', 'prod-1', 0);
    expect(result.items).toHaveLength(0);
  });

  it('rejects when the requested quantity exceeds available stock', async () => {
    cartRepository.findByUserId.mockResolvedValue(cartWithLine());
    productRepository.findById.mockResolvedValue(
      new Product({ id: 'prod-1', stock: 1, price: 100 } as Partial<Product>),
    );
    await expect(useCase.execute('user-1', 'prod-1', 5)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('updates the quantity and refreshes priceAtAdd on success', async () => {
    cartRepository.findByUserId.mockResolvedValue(cartWithLine());
    productRepository.findById.mockResolvedValue(
      new Product({ id: 'prod-1', stock: 10, price: 199 } as Partial<Product>),
    );
    const result = await useCase.execute('user-1', 'prod-1', 4);
    expect(result.items[0].quantity).toBe(4);
    expect(result.items[0].priceAtAdd).toBe(199);
  });
});
