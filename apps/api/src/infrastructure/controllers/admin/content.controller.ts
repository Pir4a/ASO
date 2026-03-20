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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { GetContentUseCase } from '../../../application/use-cases/content/get-content.use-case';
import { CreateContentBlockUseCase } from '../../../application/use-cases/content/create-content-block.use-case';
import { UpdateContentBlockUseCase } from '../../../application/use-cases/content/update-content-block.use-case';
import { DeleteContentBlockUseCase } from '../../../application/use-cases/content/delete-content-block.use-case';
import { UpdateHomepageContentUseCase } from '../../../application/use-cases/content/update-homepage-content.use-case';
import { ContentBlock, ContentType } from '../../../infrastructure/persistence/typeorm/entities/content-block.entity';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminContentController {
  constructor(
    private readonly getContentUseCase: GetContentUseCase,
    private readonly createContentBlockUseCase: CreateContentBlockUseCase,
    private readonly updateContentBlockUseCase: UpdateContentBlockUseCase,
    private readonly deleteContentBlockUseCase: DeleteContentBlockUseCase,
    private readonly updateHomepageContentUseCase: UpdateHomepageContentUseCase,
  ) { }

  @Get()
  async getAllContent(@Query('type') type?: string) {
    const allContent = await this.getContentUseCase.execute();
    if (type) {
      return allContent.filter(c => c.type === type);
    }
    return allContent;
  }

  @Get('homepage')
  async getHomepageContent() {
    const allContent = await this.getContentUseCase.execute();
    return {
      carousel: allContent.filter(c => c.type === 'carousel').sort((a, b) => (a.order || 0) - (b.order || 0)),
      hero: allContent.find(c => c.type === 'homepage_hero'),
      features: allContent.find(c => c.type === 'homepage_features'),
      cta: allContent.find(c => c.type === 'homepage_cta'),
      featuredProducts: allContent.find(c => c.type === 'featured_products'),
      featuredCategories: allContent.find(c => c.type === 'featured_categories'),
    };
  }

  @Put('homepage')
  async updateHomepageContent(@Body() body: {
    carousel?: any[];
    hero?: any;
    features?: any;
    cta?: any;
    featuredProducts?: any;
    featuredCategories?: any;
  }) {
    return this.updateHomepageContentUseCase.execute(body);
  }

  @Post()
  async createContentBlock(@Body() body: {
    type: string;
    payload?: Record<string, unknown>;
    order?: number;
  }) {
    return this.createContentBlockUseCase.execute({
      type: body.type as ContentType,
      payload: body.payload,
      order: body.order,
    });
  }

  @Put(':id')
  async updateContentBlock(
    @Param('id') id: string,
    @Body() body: {
      type?: string;
      payload?: Record<string, unknown>;
      order?: number;
    }
  ) {
    return this.updateContentBlockUseCase.execute({
      id,
      type: body.type as ContentType | undefined,
      payload: body.payload,
      order: body.order,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContentBlock(@Param('id') id: string) {
    await this.deleteContentBlockUseCase.execute(id);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: join(process.cwd(), 'storage', 'uploads', 'content'),
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `content-${uniqueSuffix}${extname(file.originalname)}`);
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
    const imageUrl = `/uploads/content/${file.filename}`;
    return this.updateContentBlockUseCase.execute({
      id,
      payload: { imageUrl }
    });
  }
}