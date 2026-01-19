import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../../domain/entities/category.entity';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

@Injectable()
export class GetCategoriesUseCase {
    constructor(
        @Inject(CATEGORY_REPOSITORY_TOKEN)
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(): Promise<Category[]> {
        return this.categoryRepository.findAll();
    }
}
