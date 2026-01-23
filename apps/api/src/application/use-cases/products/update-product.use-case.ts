import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

export interface UpdateProductCommand {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
  categoryId?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  specs?: Record<string, any>;
  displayOrder?: number;
  relatedProductIds?: string[];
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async execute(command: UpdateProductCommand) {
    const product = await this.productRepository.findById(command.id);
    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    if (command.categoryId && command.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findById(command.categoryId);
      if (!category) {
        throw new NotFoundException('Catégorie introuvable.');
      }
      product.categoryId = command.categoryId;
    }

    if (command.slug || command.name) {
      const nextSlug = command.slug || slugify(command.name || product.name, { lower: true, strict: true });
      const existing = await this.productRepository.findOneBySlug(nextSlug);
      if (existing && existing.id !== product.id) {
        throw new ConflictException(`Un produit avec le slug "${nextSlug}" existe déjà.`);
      }
      product.slug = nextSlug;
    }

    if (command.name !== undefined) product.name = command.name;
    if (command.description !== undefined) product.description = command.description;
    if (command.price !== undefined) product.price = command.price;
    if (command.stock !== undefined) product.stock = command.stock;
    if (command.status !== undefined) product.status = command.status;
    if (command.thumbnailUrl !== undefined) product.thumbnailUrl = command.thumbnailUrl;
    if (command.imageUrls !== undefined) product.imageUrls = command.imageUrls;
    if (command.specs !== undefined) product.specs = command.specs;
    if (command.displayOrder !== undefined) product.displayOrder = command.displayOrder;
    if (command.relatedProductIds !== undefined) product.relatedProductIds = command.relatedProductIds;

    return this.productRepository.update(product);
  }
}
