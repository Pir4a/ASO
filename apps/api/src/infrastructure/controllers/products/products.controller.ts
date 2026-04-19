import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { GetProductsUseCase } from '../../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../../application/use-cases/products/create-product.use-case';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
    PRODUCT_REPOSITORY_TOKEN,
    type ProductRepository,
} from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly getProductsUseCase: GetProductsUseCase,
        private readonly findProductBySlugUseCase: FindProductBySlugUseCase,
        private readonly createProductUseCase: CreateProductUseCase,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
    ) { }

    @Get()
    findAll() {
        return this.getProductsUseCase.execute();
    }

    @Get('featured')
    async findFeatured(@Query('limit') limit?: string) {
        const parsedLimit = Math.max(
            1,
            Math.min(20, Number.parseInt(limit ?? '8', 10) || 8),
        );
        return this.productRepository.findFeatured(parsedLimit);
    }

    @Get(':slug')
    findOne(@Param('slug') slug: string) {
        return this.findProductBySlugUseCase.execute(slug);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.createProductUseCase.execute(createProductDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateProductDto) {
        const existing = await this.productRepository.findById(id);
        if (!existing) throw new NotFoundException('Produit introuvable.');

        if (body.slug && body.slug !== existing.slug) {
            const clash = await this.productRepository.findOneBySlug(body.slug);
            if (clash && clash.id !== id) {
                throw new BadRequestException('Slug déjà utilisé.');
            }
        }

        const updated = new Product({
            ...existing,
            ...body,
        });

        return this.productRepository.update(updated);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async delete(@Param('id') id: string) {
        const existing = await this.productRepository.findById(id);
        if (!existing) throw new NotFoundException('Produit introuvable.');
        await this.productRepository.delete(id);
        return { success: true };
    }
}
