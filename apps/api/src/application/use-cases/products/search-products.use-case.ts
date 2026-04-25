import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY_TOKEN,
  type ProductRepository,
  type ProductSearchParams,
  type ProductSearchResult,
} from '../../../domain/repositories/product.repository.interface';

@Injectable()
export class SearchProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
  ) {}

  execute(params: ProductSearchParams): Promise<ProductSearchResult> {
    return this.productRepository.search(params);
  }
}
