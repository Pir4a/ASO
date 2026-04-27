import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';

@Injectable()
export class FindProductBySlugUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
    ) { }

    async execute(slug: string): Promise<Product | null> {
        let product = await this.productRepository.findOneBySlug(slug);
        if (!product) {
            // Accept compact slugs like `ct-500` and resolve to full canonical slugs
            // such as `ct-500-high-resolution-scanner`.
            product = await this.productRepository.findOneBySlugPrefix(slug);
        }
        // Hide drafts from the public product page.
        if (!product || product.published === false) return null;
        return product;
    }
}
