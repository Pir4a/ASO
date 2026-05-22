import { FindProductBySlugUseCase } from './find-product-by-slug.use-case';
import { Product } from '../../../domain/entities/product.entity';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';

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

describe('FindProductBySlugUseCase', () => {
  let productRepository: jest.Mocked<ProductRepository>;
  let useCase: FindProductBySlugUseCase;

  beforeEach(() => {
    productRepository = buildProductRepo();
    useCase = new FindProductBySlugUseCase(productRepository);
  });

  it('returns the product when it exists and is published', async () => {
    const product = new Product({
      id: 'p1',
      slug: 'scanner-1',
      name: 'Scanner 1',
      published: true,
    });
    productRepository.findOneBySlug.mockResolvedValue(product);

    const result = await useCase.execute('scanner-1');
    expect(result).toBe(product);
  });

  it('returns null when the repository finds no product', async () => {
    productRepository.findOneBySlug.mockResolvedValue(null);
    const result = await useCase.execute('missing');
    expect(result).toBeNull();
  });

  it('hides drafts (published === false) from the public storefront', async () => {
    productRepository.findOneBySlug.mockResolvedValue(
      new Product({ id: 'p2', slug: 'draft', name: 'Draft', published: false }),
    );
    const result = await useCase.execute('draft');
    expect(result).toBeNull();
  });
});
