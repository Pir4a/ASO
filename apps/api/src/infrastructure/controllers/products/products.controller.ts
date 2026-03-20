import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GetProductsUseCase } from '../../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../../application/use-cases/products/create-product.use-case';
import { SearchProductsUseCase } from '../../../application/use-cases/products/search-products.use-case';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly getProductsUseCase: GetProductsUseCase,
        private readonly findProductBySlugUseCase: FindProductBySlugUseCase,
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly searchProductsUseCase: SearchProductsUseCase,
    ) { }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('category') categoryId?: string,
        @Query('status') status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new',
        @Query('availability') availability?: 'in_stock' | 'out_of_stock',
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('sortBy') sortBy?: 'createdAt' | 'name' | 'price' | 'displayOrder' | 'relevance',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        // If no query params provided, return all products (backward compatible)
        const hasFilters = search || categoryId || status || availability || minPrice || maxPrice || sortBy || sortOrder || page || limit;

        if (!hasFilters) {
            return this.getProductsUseCase.execute();
        }

        // Use search with filters
        return this.searchProductsUseCase.execute({
            search,
            categoryId,
            status,
            availability,
            minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 12,
        });
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
