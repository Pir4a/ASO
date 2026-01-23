import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

@Injectable()
export class UpdateCategoryStatusUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async execute(id: string, isActive: boolean) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }
    return this.categoryRepository.updateStatus(id, isActive);
  }
}
