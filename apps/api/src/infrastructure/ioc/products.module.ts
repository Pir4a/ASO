import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product as ProductEntity } from '../persistence/typeorm/entities/product.entity';
import { TypeOrmProductRepository } from '../persistence/typeorm/repositories/product.repository';
import { ProductsController } from '../controllers/products/products.controller';
import { GetProductsUseCase } from '../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case';
import { PRODUCT_REPOSITORY_TOKEN } from '../../domain/repositories/product.repository.interface';
import { CategoriesModule } from './categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: TypeOrmProductRepository,
    },
    GetProductsUseCase,
    FindProductBySlugUseCase,
    CreateProductUseCase,
  ],
  exports: [GetProductsUseCase, FindProductBySlugUseCase],
})
export class ProductsModule { }
