import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product as ProductEntity } from '../persistence/typeorm/entities/product.entity';
import { TypeOrmProductRepository } from '../persistence/typeorm/repositories/product.repository';
import { ProductsController } from '../controllers/products/products.controller';
import { AdminProductsController } from '../controllers/admin/products.controller';
import { GetProductsUseCase } from '../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case';
import { SearchProductsUseCase } from '../../application/use-cases/products/search-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/products/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/products/delete-product.use-case';
import { BulkUpdateProductsUseCase } from '../../application/use-cases/products/bulk-update-products.use-case';
import { PRODUCT_REPOSITORY_TOKEN } from '../../domain/repositories/product.repository.interface';
import { CategoriesModule } from './categories.module';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    CategoriesModule,
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: TypeOrmProductRepository,
    },
    GetProductsUseCase,
    FindProductBySlugUseCase,
    CreateProductUseCase,
    SearchProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    BulkUpdateProductsUseCase,
    RolesGuard,
  ],
  exports: [PRODUCT_REPOSITORY_TOKEN, GetProductsUseCase, FindProductBySlugUseCase, SearchProductsUseCase],
})
export class ProductsModule { }

