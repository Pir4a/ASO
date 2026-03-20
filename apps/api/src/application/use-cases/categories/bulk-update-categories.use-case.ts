import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

@Injectable()
export class BulkUpdateCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async updateStatus(ids: string[], isActive: boolean): Promise<void> {
    await this.categoryRepository.bulkUpdateStatus(ids, isActive);
  }

  async softDelete(ids: string[]): Promise<void> {
    await this.categoryRepository.bulkSoftDelete(ids);
  }
}
