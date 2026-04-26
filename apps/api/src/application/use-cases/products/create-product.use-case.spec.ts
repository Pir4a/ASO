import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateProductUseCase } from './create-product.use-case';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { Category } from '../../../domain/entities/category.entity';
import { Product } from '../../../domain/entities/product.entity';

describe('CreateProductUseCase', () => {
  const productRepository: jest.Mocked<ProductRepository> = {
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

  const categoryRepository: jest.Mocked<CategoryRepository> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findBySlug: jest.fn(),
  };

  const useCase = new CreateProductUseCase(
    productRepository,
    categoryRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const existingCategory = new Category({
    id: 'cat-uuid',
    name: 'Imagerie',
    slug: 'imagerie',
    isActive: true,
    order: 1,
  });

  it('uses explicit slug from command (SEO custom URL)', async () => {
    categoryRepository.findById.mockResolvedValue(existingCategory);
    productRepository.findOneBySlug.mockResolvedValue(null);
    productRepository.create.mockImplementation((p) => Promise.resolve(p));

    const created = await useCase.execute({
      name: 'Scanner Premium',
      slug: 'scanner-premium-seo',
      categoryId: existingCategory.id,
      price: 1299.99,
      stock: 8,
      description: 'desc',
    });

    expect(created.slug).toBe('scanner-premium-seo');
    expect(productRepository.findOneBySlug.mock.calls).toContainEqual([
      'scanner-premium-seo',
    ]);
  });

  it('falls back to auto-generated slug when explicit slug is absent', async () => {
    categoryRepository.findById.mockResolvedValue(existingCategory);
    productRepository.findOneBySlug.mockResolvedValue(null);
    productRepository.create.mockImplementation((p) => Promise.resolve(p));

    const created = await useCase.execute({
      name: 'Scanner IRM 500',
      categoryId: existingCategory.id,
      price: 1299.99,
      stock: 8,
      description: 'desc',
    });

    expect(created.slug).toBe('scanner-irm-500');
    expect(productRepository.findOneBySlug.mock.calls).toContainEqual([
      'scanner-irm-500',
    ]);
  });

  it('throws NotFoundException when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'Scanner IRM 500',
        categoryId: 'missing-cat',
        price: 1299.99,
        stock: 8,
        description: 'desc',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when slug already exists', async () => {
    categoryRepository.findById.mockResolvedValue(existingCategory);
    productRepository.findOneBySlug.mockResolvedValue(
      new Product({ id: 'p1', slug: 'taken' }),
    );

    await expect(
      useCase.execute({
        name: 'Scanner IRM 500',
        slug: 'taken',
        categoryId: existingCategory.id,
        price: 1299.99,
        stock: 8,
        description: 'desc',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
