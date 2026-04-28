import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetCategoriesUseCase } from '../../../application/use-cases/categories/get-categories.use-case';
import { FindCategoryByIdUseCase } from '../../../application/use-cases/categories/find-category-by-id.use-case';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { Category } from '../../../domain/entities/category.entity';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { BulkCategoryActionDto, CreateCategoryDto, ReorderCategoriesDto, UpdateCategoryDto } from '../../dto/categories/category-admin.dto';
import { localizeCategory } from '../../../lib/i18n-localize';
import { AutoTranslationService } from '../../services/auto-translation.service';

@Controller('categories')
export class CategoriesController {
    constructor(
      private readonly getCategoriesUseCase: GetCategoriesUseCase,
      private readonly findCategoryByIdUseCase: FindCategoryByIdUseCase,
      @Inject(CATEGORY_REPOSITORY_TOKEN)
      private readonly categoryRepository: CategoryRepository,
      private readonly autoTranslationService: AutoTranslationService,
    ) { }

    @Get()
    async findAll(@Query('includeInactive') includeInactive?: string, @Query('lang') lang?: string) {
        const categories = await this.getCategoriesUseCase.execute();
        const filtered = includeInactive === 'true' ? categories : categories.filter((c) => c.isActive !== false);
        return filtered.map((c) => localizeCategory(c, lang));
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() body: CreateCategoryDto) {
      const exists = await this.categoryRepository.findBySlug(body.slug);
      if (exists) return { message: 'Slug déjà utilisé.' };

      const created = await this.categoryRepository.create(
        new Category({
          name: body.name,
          slug: body.slug,
          description: body.description,
          imageUrl: body.imageUrl,
          order: body.order ?? 0,
          isActive: true,
          translations: await this.autoTranslationService.ensureTranslations({
            name: body.name,
            description: body.description ?? '',
            existing: body.translations,
          }),
        }),
      );
      return created;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
      const category = await this.findCategoryByIdUseCase.execute(id);
      if (!category) return { message: 'Catégorie introuvable.' };

      if (body.slug && body.slug !== category.slug) {
        const exists = await this.categoryRepository.findBySlug(body.slug);
        if (exists) return { message: 'Slug déjà utilisé.' };
      }

      const updated = await this.categoryRepository.update(
        new Category({
          ...category,
          ...body,
          translations: await this.autoTranslationService.ensureTranslations({
            name: body.name ?? category.name,
            description: body.description ?? category.description ?? '',
            existing: body.translations ?? category.translations,
          }),
          isActive: body.isActive ?? category.isActive,
        }),
      );
      return updated;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async delete(@Param('id') id: string) {
      await this.categoryRepository.delete(id);
      return { success: true };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('reorder/list')
    async reorder(@Body() body: ReorderCategoriesDto) {
      const categories = await this.getCategoriesUseCase.execute();
      const byId = new Map(categories.map((c) => [c.id, c]));

      for (const item of body.items) {
        const category = byId.get(item.id);
        if (!category) continue;
        category.order = item.order;
        await this.categoryRepository.update(category);
      }
      return { success: true };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('bulk')
    async bulk(@Body() body: BulkCategoryActionDto) {
      for (const id of body.ids) {
        const category = await this.findCategoryByIdUseCase.execute(id);
        if (!category) continue;
        if (body.action === 'delete') {
          await this.categoryRepository.delete(id);
          continue;
        }
        category.isActive = body.action === 'activate';
        await this.categoryRepository.update(category);
      }
      return { success: true };
    }
}
