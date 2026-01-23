import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category as CategoryEntity } from '../persistence/typeorm/entities/category.entity';
import { TypeOrmCategoryRepository } from '../persistence/typeorm/repositories/category.repository';
import { CategoriesController } from '../controllers/categories/categories.controller';
import { AdminCategoriesController } from '../controllers/admin/categories.controller';
import { GetCategoriesUseCase } from '../../application/use-cases/categories/get-categories.use-case';
import { FindCategoryByIdUseCase } from '../../application/use-cases/categories/find-category-by-id.use-case';
import { CreateCategoryUseCase } from '../../application/use-cases/categories/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/categories/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/categories/delete-category.use-case';
import { UpdateCategoryStatusUseCase } from '../../application/use-cases/categories/update-category-status.use-case';
import { ReorderCategoriesUseCase } from '../../application/use-cases/categories/reorder-categories.use-case';
import { BulkUpdateCategoriesUseCase } from '../../application/use-cases/categories/bulk-update-categories.use-case';
import { CATEGORY_REPOSITORY_TOKEN } from '../../domain/repositories/category.repository.interface';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY_TOKEN,
      useClass: TypeOrmCategoryRepository,
    },
    GetCategoriesUseCase,
    FindCategoryByIdUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    UpdateCategoryStatusUseCase,
    ReorderCategoriesUseCase,
    BulkUpdateCategoriesUseCase,
    RolesGuard,
  ],
  exports: [GetCategoriesUseCase, FindCategoryByIdUseCase, CATEGORY_REPOSITORY_TOKEN],
})
export class CategoriesModule { }
