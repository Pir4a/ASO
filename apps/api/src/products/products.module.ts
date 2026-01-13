import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Category } from '../entities/category.entity'; // Import de l'entité Category

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])], // Ajout de Category à forFeature
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
