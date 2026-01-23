import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';

export interface UpdateCategoryCommand {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async execute(command: UpdateCategoryCommand) {
    const category = await this.categoryRepository.findById(command.id);
    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    if (command.slug || command.name) {
      const nextSlug = command.slug || slugify(command.name || category.name, { lower: true, strict: true });
      const existing = await this.categoryRepository.findBySlug(nextSlug);
      if (existing && existing.id !== category.id) {
        throw new ConflictException(`Une catégorie avec le slug "${nextSlug}" existe déjà.`);
      }
      category.slug = nextSlug;
    }

    if (command.name !== undefined) category.name = command.name;
    if (command.description !== undefined) category.description = command.description;
    if (command.imageUrl !== undefined) category.imageUrl = command.imageUrl;
    if (command.isActive !== undefined) category.isActive = command.isActive;

    return this.categoryRepository.update(category);
  }
}
