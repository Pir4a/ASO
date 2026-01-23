import { ConflictException, Inject, Injectable } from '@nestjs/common';
import slugify from 'slugify';
import { Category } from '../../../domain/entities/category.entity';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

export interface CreateCategoryCommand {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const slug = command.slug || slugify(command.name, { lower: true, strict: true });

    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Une catégorie avec le slug "${slug}" existe déjà.`);
    }

    const allCategories = await this.categoryRepository.findAllAdmin();
    const maxOrder = allCategories.reduce((max, category) => Math.max(max, category.displayOrder ?? 0), 0);

    const category = new Category({
      name: command.name,
      slug,
      description: command.description,
      imageUrl: command.imageUrl,
      isActive: command.isActive ?? true,
      displayOrder: command.displayOrder ?? maxOrder + 1,
    });

    return this.categoryRepository.create(category);
  }
}
