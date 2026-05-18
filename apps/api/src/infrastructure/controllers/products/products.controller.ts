import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Inject,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { buildCsv } from '../../../lib/csv';
import { GetProductsUseCase } from '../../../application/use-cases/products/get-products.use-case';
import { FindProductBySlugUseCase } from '../../../application/use-cases/products/find-product-by-slug.use-case';
import { CreateProductUseCase } from '../../../application/use-cases/products/create-product.use-case';
import { CreateProductDto } from './dto/create-product.dto';
import { StockNotifyDto } from './dto/stock-notify.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
    PRODUCT_REPOSITORY_TOKEN,
    type ProductRepository,
    type ProductSearchSort,
} from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { SearchProductsUseCase } from '../../../application/use-cases/products/search-products.use-case';
import { SubscribeProductStockNotifyUseCase } from '../../../application/use-cases/products/subscribe-product-stock-notify.use-case';

type RequestWithOptionalUser = { user?: { sub: string; email: string } };

@Controller('products')
export class ProductsController {
    constructor(
        private readonly getProductsUseCase: GetProductsUseCase,
        private readonly findProductBySlugUseCase: FindProductBySlugUseCase,
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly searchProductsUseCase: SearchProductsUseCase,
        private readonly subscribeProductStockNotifyUseCase: SubscribeProductStockNotifyUseCase,
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
            publishedOnly: true,
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
                publishedOnly: true,
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

    /** Alert when product is back in stock (logged-in uses JWT email; guest supplies `email`). */
    @Post(':productId/stock-notify')
    @UseGuards(OptionalJwtAuthGuard)
    subscribeStockNotify(
        @Param('productId') productId: string,
        @Body() dto: StockNotifyDto,
        @Req() req: RequestWithOptionalUser,
    ) {
        return this.subscribeProductStockNotifyUseCase.execute({
            productId,
            emailFromBody: dto.email,
            user: req.user,
        });
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
    async findOne(@Param('slug') slug: string) {
        const product = await this.findProductBySlugUseCase.execute(slug);
        if (!product) throw new NotFoundException('Produit introuvable.');
        return product;
    }

    /** Admin listing — returns drafts too. */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin/all')
    adminFindAll() {
        return this.getProductsUseCase.execute({ includeDrafts: true });
    }

    /** #26 — admin CSV export of the product catalog (drafts included). */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin/export.csv')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="products.csv"')
    async adminExportCsv() {
        const products = await this.getProductsUseCase.execute({ includeDrafts: true });
        return buildCsv(products, [
            { header: 'sku', value: (p) => p.sku },
            { header: 'slug', value: (p) => p.slug },
            { header: 'name', value: (p) => p.name },
            { header: 'category', value: (p) => p.category?.name ?? '' },
            { header: 'price', value: (p) => Number(p.price ?? 0).toFixed(2) },
            { header: 'currency', value: (p) => p.currency ?? 'EUR' },
            { header: 'vatRate', value: (p) => p.vatRate ?? 20 },
            { header: 'stock', value: (p) => p.stock ?? 0 },
            { header: 'status', value: (p) => p.status ?? '' },
            { header: 'published', value: (p) => (p.published === false ? 'false' : 'true') },
            { header: 'featured', value: (p) => (p.featured ? 'true' : 'false') },
            { header: 'listPriority', value: (p) => p.listPriority ?? 0 },
        ]);
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
