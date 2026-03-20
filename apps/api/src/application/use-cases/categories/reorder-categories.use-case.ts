import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

export interface CategoryOrderUpdate {
  id: string;
  displayOrder: number;
}

@Injectable()
export class ReorderCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async execute(updates: CategoryOrderUpdate[]): Promise<void> {
    await this.categoryRepository.reorder(updates);
  }
}
