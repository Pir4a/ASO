import { NotFoundException } from '@nestjs/common';
import { RemoveFromCartUseCase } from './remove-from-cart.use-case';
import { Cart, CartItem } from '../../../domain/entities/cart.entity';
import type { CartRepository } from '../../../domain/repositories/cart.repository.interface';

function buildCartRepo(): jest.Mocked<CartRepository> {
  return {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('RemoveFromCartUseCase', () => {
  let cartRepository: jest.Mocked<CartRepository>;
  let useCase: RemoveFromCartUseCase;

  beforeEach(() => {
    cartRepository = buildCartRepo();
    useCase = new RemoveFromCartUseCase(cartRepository);
    cartRepository.update.mockImplementation((c) => Promise.resolve(c));
  });

  it('throws NotFoundException when the user has no cart', async () => {
    cartRepository.findByUserId.mockResolvedValue(null);
    await expect(useCase.execute('user-1', 'prod-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the product is not in the cart', async () => {
    cartRepository.findByUserId.mockResolvedValue(
      new Cart({ id: 'c1', userId: 'user-1', status: 'active', items: [] }),
    );
    await expect(useCase.execute('user-1', 'prod-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('drops the matching line and persists the rest', async () => {
    const cart = new Cart({
      id: 'c1',
      userId: 'user-1',
      status: 'active',
      items: [
        new CartItem({ id: 'a', cartId: 'c1', productId: 'prod-1', quantity: 1 }),
        new CartItem({ id: 'b', cartId: 'c1', productId: 'prod-2', quantity: 3 }),
      ],
    });
    cartRepository.findByUserId.mockResolvedValue(cart);

    const result = await useCase.execute('user-1', 'prod-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe('prod-2');
  });
});
