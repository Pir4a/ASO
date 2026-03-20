import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    stock: number;
    description: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
    thumbnailUrl?: string;
    imageUrls?: string[];
    specs?: Record<string, any>;
    displayOrder?: number;
    relatedProductIds?: string[];
}

@Injectable()
export class CreateProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
        @Inject(CATEGORY_REPOSITORY_TOKEN)
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(command: CreateProductCommand): Promise<Product> {
        const { name, slug, categoryId, price, stock, description } = command;

        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new NotFoundException(`Category with ID "${categoryId}" not found.`);
        }

        const productSlug = slug || slugify(name, { lower: true, strict: true });

        const existingProduct = await this.productRepository.findOneBySlug(productSlug);
        if (existingProduct) {
            throw new ConflictException(`Un produit avec le slug "${productSlug}" existe déjà.`);
        }

        const generatedSku = uuidv4();

        const product = new Product({
            name,
            slug: productSlug,
            description,
            price,
            stock,
            sku: generatedSku,
            currency: 'EUR',
            status: command.status || 'new',
            categoryId,
            category,
            thumbnailUrl: command.thumbnailUrl || command.imageUrls?.[0],
            imageUrls: command.imageUrls || [],
            specs: command.specs || {},
            displayOrder: command.displayOrder || 0,
            relatedProductIds: command.relatedProductIds || [],
        });

        return this.productRepository.create(product);
    }
}
