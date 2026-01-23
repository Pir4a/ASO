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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import fs from 'fs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreateCategoryUseCase } from '../../../application/use-cases/categories/create-category.use-case';
import { UpdateCategoryUseCase } from '../../../application/use-cases/categories/update-category.use-case';
import { DeleteCategoryUseCase } from '../../../application/use-cases/categories/delete-category.use-case';
import { UpdateCategoryStatusUseCase } from '../../../application/use-cases/categories/update-category-status.use-case';
import { ReorderCategoriesUseCase } from '../../../application/use-cases/categories/reorder-categories.use-case';
import { BulkUpdateCategoriesUseCase } from '../../../application/use-cases/categories/bulk-update-categories.use-case';
import { CATEGORY_REPOSITORY_TOKEN } from '../../../domain/repositories/category.repository.interface';
import type { CategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { Inject } from '@nestjs/common';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCategoriesController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly updateCategoryStatusUseCase: UpdateCategoryStatusUseCase,
    private readonly reorderCategoriesUseCase: ReorderCategoriesUseCase,
    private readonly bulkUpdateCategoriesUseCase: BulkUpdateCategoriesUseCase,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
  ) { }

  @Get()
  async listAdmin() {
    return this.categoryRepository.findAllAdmin();
  }

  @Post()
  async create(@Body() body: {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
    displayOrder?: number;
  }) {
    return this.createCategoryUseCase.execute(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      slug?: string;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
    }
  ) {
    return this.updateCategoryUseCase.execute({ id, ...body });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteCategoryUseCase.execute(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.updateCategoryStatusUseCase.execute(id, Boolean(isActive));
  }

  @Patch('reorder')
  async reorder(@Body('items') items: Array<{ id: string; displayOrder: number }>) {
    await this.reorderCategoriesUseCase.execute(items || []);
    return { success: true };
  }

  @Patch('status')
  async bulkStatus(@Body() body: { ids: string[]; isActive: boolean }) {
    await this.bulkUpdateCategoriesUseCase.updateStatus(body.ids || [], Boolean(body.isActive));
    return { success: true };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkDelete(@Body('ids') ids: string[]) {
    await this.bulkUpdateCategoriesUseCase.softDelete(ids || []);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const destination = join(process.cwd(), 'storage', 'uploads', 'categories');
        fs.mkdirSync(destination, { recursive: true });
        cb(null, destination);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `category-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      return { imageUrl: null };
    }
    const imageUrl = `/uploads/categories/${file.filename}`;
    return this.updateCategoryUseCase.execute({ id, imageUrl });
  }
}
