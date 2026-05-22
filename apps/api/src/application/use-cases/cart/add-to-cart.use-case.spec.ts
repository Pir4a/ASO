import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddToCartUseCase } from './add-to-cart.use-case';
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

const product = (overrides: Partial<Product> = {}) =>
  new Product({
    id: 'prod-1',
    sku: 'SKU-1',
    slug: 'scanner-1',
    name: 'Scanner 1',
    description: 'd',
    price: 1299,
    currency: 'EUR',
    stock: 5,
    categoryId: 'cat',
    published: true,
    featured: false,
    featuredOrder: 0,
    listPriority: 0,
    thumbnailUrl: undefined,
    ...overrides,
  } as Partial<Product>);

describe('AddToCartUseCase', () => {
  let cartRepository: jest.Mocked<CartRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let useCase: AddToCartUseCase;

  beforeEach(() => {
    cartRepository = buildCartRepo();
    productRepository = buildProductRepo();
    useCase = new AddToCartUseCase(cartRepository, productRepository);
    cartRepository.create.mockImplementation((c) => Promise.resolve(c));
    cartRepository.update.mockImplementation((c) => Promise.resolve(c));
  });

  it('throws NotFoundException when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('user-1', 'missing', 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a brand-new cart on first add and snapshots product fields on the line', async () => {
    productRepository.findById.mockResolvedValue(product());
    cartRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute('user-1', 'prod-1', 2);

    expect(cartRepository.create).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe('user-1');
    expect(result.items).toHaveLength(1);
    const line = result.items[0];
    expect(line.productId).toBe('prod-1');
    expect(line.quantity).toBe(2);
    expect(line.priceAtAdd).toBe(1299);
    expect(line.productName).toBe('Scanner 1');
    expect(line.productCurrency).toBe('EUR');
  });

  it('merges quantities when the same product is added twice', async () => {
    productRepository.findById.mockResolvedValue(product({ stock: 10 }));
    const cart = new Cart({
      id: 'c1',
      userId: 'user-1',
      status: 'active',
      items: [
        new CartItem({
          id: 'li1',
          cartId: 'c1',
          productId: 'prod-1',
          quantity: 1,
          priceAtAdd: 1299,
        }),
      ],
    });
    cartRepository.findByUserId.mockResolvedValue(cart);

    const result = await useCase.execute('user-1', 'prod-1', 3);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(4);
  });

  it('rejects when requested total exceeds available stock (CDC §IX)', async () => {
    productRepository.findById.mockResolvedValue(product({ stock: 2 }));
    cartRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'prod-1', 5)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects when summed quantity (cart + new) exceeds stock', async () => {
    productRepository.findById.mockResolvedValue(product({ stock: 3 }));
    cartRepository.findByUserId.mockResolvedValue(
      new Cart({
        id: 'c1',
        userId: 'user-1',
        status: 'active',
        items: [
          new CartItem({
            id: 'li1',
            cartId: 'c1',
            productId: 'prod-1',
            quantity: 2,
            priceAtAdd: 1299,
          }),
        ],
      }),
    );

    await expect(useCase.execute('user-1', 'prod-1', 2)).rejects.toThrow(
      BadRequestException,
    );
  });
});
