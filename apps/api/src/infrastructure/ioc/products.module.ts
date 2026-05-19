import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscribeProductStockNotifyUseCase } from '../../application/use-cases/products/subscribe-product-stock-notify.use-case';
import { GetProductStockNotifyStatusUseCase } from '../../application/use-cases/products/get-product-stock-notify-status.use-case';
import { UnsubscribeProductStockNotifyUseCase } from '../../application/use-cases/products/unsubscribe-product-stock-notify.use-case';
import { CountProductStockNotifySubscribersUseCase } from '../../application/use-cases/products/count-product-stock-notify-subscribers.use-case';
import { NotifyProductStockSubscribersUseCase } from '../../application/use-cases/products/notify-product-stock-subscribers.use-case';
import { Product as ProductEntity } from '../persistence/typeorm/entities/product.entity';
import { ProductStockNotification } from '../persistence/typeorm/entities/product-stock-notification.entity';
import { TypeOrmProductRepository } from '../persistence/typeorm/repositories/product.repository';
import { ProductsController } from '../controllers/products/products.controller';
import { GetProductsUseCase } from '../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case';
import { SearchProductsUseCase } from '../../application/use-cases/products/search-products.use-case';
import { PRODUCT_REPOSITORY_TOKEN } from '../../domain/repositories/product.repository.interface';
import { CategoriesModule } from './categories.module';
import { AuthModule } from './auth.module';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductStockNotification]),
    CategoriesModule,
    AuthModule,
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
    SearchProductsUseCase,
    SubscribeProductStockNotifyUseCase,
    GetProductStockNotifyStatusUseCase,
    UnsubscribeProductStockNotifyUseCase,
    CountProductStockNotifySubscribersUseCase,
    NotifyProductStockSubscribersUseCase,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
  ],
  exports: [PRODUCT_REPOSITORY_TOKEN, GetProductsUseCase, FindProductBySlugUseCase],
})
export class ProductsModule { }
