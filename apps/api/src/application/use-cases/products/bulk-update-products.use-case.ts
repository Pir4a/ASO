import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { Product } from '../../../domain/entities/product.entity';

@Injectable()
export class BulkUpdateProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
  ) { }

  async execute(ids: string[], payload: Partial<Product>) {
    await this.productRepository.bulkUpdate(ids, payload);
  }
}
