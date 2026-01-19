import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GetProductsUseCase } from '../../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../../application/use-cases/products/create-product.use-case';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly getProductsUseCase: GetProductsUseCase,
        private readonly findProductBySlugUseCase: FindProductBySlugUseCase,
        private readonly createProductUseCase: CreateProductUseCase,
    ) { }

    @Get()
    findAll() {
        return this.getProductsUseCase.execute();
    }

    @Get(':slug')
    findOne(@Param('slug') slug: string) {
        return this.findProductBySlugUseCase.execute(slug);
    }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.createProductUseCase.execute(createProductDto);
    }
}
