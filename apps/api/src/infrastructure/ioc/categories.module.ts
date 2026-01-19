import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category as CategoryEntity } from '../persistence/typeorm/entities/category.entity';
import { TypeOrmCategoryRepository } from '../persistence/typeorm/repositories/category.repository';
import { CategoriesController } from '../controllers/categories/categories.controller';
import { GetCategoriesUseCase } from '../../application/use-cases/categories/get-categories.use-case';
import { FindCategoryByIdUseCase } from '../../application/use-cases/categories/find-category-by-id.use-case';
import { CATEGORY_REPOSITORY_TOKEN } from '../../domain/repositories/category.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  controllers: [CategoriesController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY_TOKEN,
      useClass: TypeOrmCategoryRepository,
    },
    GetCategoriesUseCase,
    FindCategoryByIdUseCase,
  ],
  exports: [GetCategoriesUseCase, FindCategoryByIdUseCase, CATEGORY_REPOSITORY_TOKEN],
})
export class CategoriesModule { }
