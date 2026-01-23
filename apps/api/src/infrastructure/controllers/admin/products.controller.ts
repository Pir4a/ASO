import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import fs from 'fs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { SearchProductsUseCase } from '../../../application/use-cases/products/search-products.use-case';
import { CreateProductUseCase } from '../../../application/use-cases/products/create-product.use-case';
import { UpdateProductUseCase } from '../../../application/use-cases/products/update-product.use-case';
import { DeleteProductUseCase } from '../../../application/use-cases/products/delete-product.use-case';
import { BulkUpdateProductsUseCase } from '../../../application/use-cases/products/bulk-update-products.use-case';
import { Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProductsController {
  constructor(
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly bulkUpdateProductsUseCase: BulkUpdateProductsUseCase,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
  ) { }
  @Post()
  async create(@Body() body: {
    name: string;
    slug?: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
    thumbnailUrl?: string;
    imageUrls?: string[];
    specs?: Record<string, any>;
    displayOrder?: number;
    relatedProductIds?: string[];
  }) {
    return this.createProductUseCase.execute(body);
  }

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('category') categoryId?: string,
    @Query('status') status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new',
    @Query('availability') availability?: 'in_stock' | 'out_of_stock',
    @Query('sortBy') sortBy?: 'createdAt' | 'name' | 'price' | 'displayOrder',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchProductsUseCase.execute({
      search,
      categoryId,
      status,
      availability,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      stock?: number;
      status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
      categoryId?: string;
      thumbnailUrl?: string;
      imageUrls?: string[];
      specs?: Record<string, any>;
      displayOrder?: number;
      relatedProductIds?: string[];
    }
  ) {
    return this.updateProductUseCase.execute({ id, ...body });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteProductUseCase.execute(id);
  }

  @Patch('bulk-update')
  async bulkUpdate(@Body() body: {
    ids: string[];
    payload: {
      price?: number;
      stock?: number;
      status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
      displayOrder?: number;
    };
  }) {
    await this.bulkUpdateProductsUseCase.execute(body.ids || [], body.payload || {});
    return { success: true };
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 6, {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const destination = join(process.cwd(), 'storage', 'uploads', 'products');
        fs.mkdirSync(destination, { recursive: true });
        cb(null, destination);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return { imageUrls: [] };
    }

    const uploadedUrls = (files || []).map(file => `/uploads/products/${file.filename}`);
    const imageUrls = [...(product.imageUrls || []), ...uploadedUrls];

    return this.updateProductUseCase.execute({
      id,
      imageUrls,
      thumbnailUrl: product.thumbnailUrl || uploadedUrls[0],
    });
  }
}
