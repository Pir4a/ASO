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
    type ProductSearchSort,
} from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { SearchProductsUseCase } from '../../../application/use-cases/products/search-products.use-case';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly getProductsUseCase: GetProductsUseCase,
        private readonly findProductBySlugUseCase: FindProductBySlugUseCase,
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly searchProductsUseCase: SearchProductsUseCase,
        @Inject(PRODUCT_REPOSITORY_TOKEN)
        private readonly productRepository: ProductRepository,
    ) { }

    private static readonly SEARCH_SORT_WHITELIST: ProductSearchSort[] = [
        'relevance',
        'price_asc',
        'price_desc',
        'novelty_desc',
        'novelty_asc',
        'availability_asc',
        'availability_desc',
    ];

    /**
     * Faceted product search (title, description, specs JSON, SKU; price range; category; in-stock).
     * Relevance: exact / near-exact (Levenshtein ≤ 1 on small catalogs) / prefix / contains (SQL + optional JS refine).
     * Large result sets use SQL-only relevance tiers. Reads live DB rows (same as BO) — no dedicated search engine or latency SLA.
     */
    @Get('search')
    async search(
        @Query('q') q?: string,
        @Query('categorySlug') categorySlug?: string,
        @Query('categoryId') categoryId?: string,
        @Query('minPrice') minPriceStr?: string,
        @Query('maxPrice') maxPriceStr?: string,
        @Query('inStockOnly') inStockOnlyStr?: string,
        @Query('sort') sortStr?: string,
        @Query('page') pageStr?: string,
        @Query('limit') limitStr?: string,
    ) {
        const page = Math.max(1, Number.parseInt(pageStr ?? '1', 10) || 1);
        const pageSize = Math.min(
            50,
            Math.max(1, Number.parseInt(limitStr ?? '12', 10) || 12),
        );
        const minPrice =
            minPriceStr !== undefined && minPriceStr !== ''
                ? Number.parseFloat(minPriceStr)
                : undefined;
        const maxPrice =
            maxPriceStr !== undefined && maxPriceStr !== ''
                ? Number.parseFloat(maxPriceStr)
                : undefined;
        const inStockOnly = ['1', 'true', 'yes', 'on'].includes(
            (inStockOnlyStr ?? '').toLowerCase(),
        );
        const sort = ProductsController.SEARCH_SORT_WHITELIST.includes(
            sortStr as ProductSearchSort,
        )
            ? (sortStr as ProductSearchSort)
            : 'relevance';

        const result = await this.searchProductsUseCase.execute({
            q,
            categorySlug: categorySlug || undefined,
            categoryId: categoryId || undefined,
            minPrice: minPrice !== undefined && !Number.isNaN(minPrice) ? minPrice : undefined,
            maxPrice: maxPrice !== undefined && !Number.isNaN(maxPrice) ? maxPrice : undefined,
            inStockOnly,
            sort,
            page,
            pageSize,
        });

        const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
        return {
            data: result.items,
            meta: {
                total: result.total,
                page,
                pageSize,
                totalPages,
                tookMs: result.tookMs,
                relevanceRefined: result.relevanceRefined,
            },
            facets: result.facets,
        };
    }

    /**
     * Plain `GET /products`: full list (backward compatible for BO / homepage).
     * With `categorySlug`, `categoryId`, `page`, or `limit`: paginated browse — all products or filtered —
     * sorted by BO `listPriority` DESC, then in stock before out of stock, then name.
     */
    @Get()
    async findAll(
        @Query('categorySlug') categorySlug?: string,
        @Query('categoryId') categoryId?: string,
        @Query('page') pageStr?: string,
        @Query('limit') limitStr?: string,
    ) {
        const paginate =
            !!(categorySlug || categoryId || pageStr !== undefined || limitStr !== undefined);
        if (paginate) {
            const page = Math.max(1, Number.parseInt(pageStr ?? '1', 10) || 1);
            const pageSize = Math.min(
                50,
                Math.max(1, Number.parseInt(limitStr ?? '12', 10) || 12),
            );
            const { items, total } = await this.productRepository.browse({
                categorySlug: categorySlug ?? undefined,
                categoryId: categoryId ?? undefined,
                page,
                pageSize,
            });
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            return {
                data: items,
                meta: { total, page, pageSize, totalPages },
            };
        }
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

    @Get(':slug/related')
    async related(
        @Param('slug') slug: string,
        @Query('limit') limit?: string,
    ) {
        const lim = Math.min(12, Math.max(1, Number.parseInt(limit ?? '6', 10) || 6));
        return this.productRepository.findRelatedBySlug(slug, lim);
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

        const { vatRate: bodyVat, ...bodyRest } = body;
        const updated = new Product({
            ...existing,
            ...bodyRest,
            ...(bodyVat !== undefined
                ? {
                    vatRate: ([0, 5.5, 10, 20] as const).includes(bodyVat as 0 | 5.5 | 10 | 20)
                        ? (bodyVat as 0 | 5.5 | 10 | 20)
                        : existing.vatRate,
                }
                : {}),
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
