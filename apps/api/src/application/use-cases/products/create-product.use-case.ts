import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Product } from '../../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

export interface CreateProductCommand {
  name: string;
  slug?: string;
  categoryId: string;
  price: number;
  /** VAT % — 0, 5.5, 10 ou 20 (défaut 20). */
  vatRate?: number;
  stock: number;
  description: string;
  featured?: boolean;
  featuredOrder?: number;
  thumbnailUrl?: string;
  listPriority?: number;
  galleryUrls?: string[];
  specs?: Record<string, string>;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const {
      name,
      slug,
      categoryId,
      price,
      vatRate: rawVat,
      stock,
      description,
      featured,
      featuredOrder,
      thumbnailUrl,
      listPriority,
      galleryUrls,
      specs,
    } = command;
    const vatAllowed = new Set([0, 5.5, 10, 20]);
    const vatRate = vatAllowed.has(Number(rawVat))
      ? (Number(rawVat) as Product['vatRate'])
      : 20;

    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(
        `Category with ID "${categoryId}" not found.`,
      );
    }

    const productSlug = slug || slugify(name, { lower: true, strict: true });

    const existingProduct =
      await this.productRepository.findOneBySlug(productSlug);
    if (existingProduct) {
      throw new ConflictException(
        `Un produit avec le slug "${productSlug}" existe déjà.`,
      );
    }

    const generatedSku = uuidv4();

    const product = new Product({
      name,
      slug: productSlug,
      description,
      price,
      vatRate,
      stock,
      sku: generatedSku,
      currency: 'EUR',
      status: 'new',
      featured: featured ?? false,
      featuredOrder: featuredOrder ?? 0,
      listPriority: listPriority ?? 0,
      galleryUrls,
      specs,
      thumbnailUrl,
      categoryId,
      category,
    });

    return this.productRepository.create(product);
  }
}
