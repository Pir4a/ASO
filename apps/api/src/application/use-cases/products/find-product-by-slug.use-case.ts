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
        return this.productRepository.findOneBySlug(slug);
    }
}
