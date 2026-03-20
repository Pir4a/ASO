import { Inject, Injectable } from '@nestjs/common';
import {
    PRODUCT_REPOSITORY_TOKEN,
    ProductSearchParams,
    PaginatedResult
} from '../../../domain/repositories/product.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';

@Injectable()
export class SearchProductsUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
    ) { }

    async execute(params: ProductSearchParams): Promise<PaginatedResult<Product>> {
        return this.productRepository.findWithFilters(params);
    }
}
