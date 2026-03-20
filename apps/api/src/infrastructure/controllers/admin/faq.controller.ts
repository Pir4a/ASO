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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { GetFAQsUseCase } from '../../../application/use-cases/faq/get-faqs.use-case';
import { CreateFAQUseCase } from '../../../application/use-cases/faq/create-faq.use-case';
import { UpdateFAQUseCase } from '../../../application/use-cases/faq/update-faq.use-case';
import { DeleteFAQUseCase } from '../../../application/use-cases/faq/delete-faq.use-case';

@Controller('admin/faq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminFAQController {
  constructor(
    private readonly getFAQsUseCase: GetFAQsUseCase,
    private readonly createFAQUseCase: CreateFAQUseCase,
    private readonly updateFAQUseCase: UpdateFAQUseCase,
    private readonly deleteFAQUseCase: DeleteFAQUseCase,
  ) {}

  @Get()
  async getAllFAQs(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.getFAQsUseCase.execute(include);
  }

  @Post()
  async createFAQ(@Body() body: {
    question: string;
    answer: string;
    status?: 'active' | 'inactive';
    order?: number;
  }) {
    return this.createFAQUseCase.execute(body);
  }

  @Patch(':id')
  async updateFAQ(
    @Param('id') id: string,
    @Body() body: {
      question?: string;
      answer?: string;
      status?: 'active' | 'inactive';
      order?: number;
    }
  ) {
    return this.updateFAQUseCase.execute({ id, ...body });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFAQ(@Param('id') id: string) {
    await this.deleteFAQUseCase.execute(id);
  }

  @Patch('reorder')
  async reorderFAQs(@Body('items') items: Array<{ id: string; order: number }>) {
    // Update order for each FAQ
    await Promise.all(
      items.map(item => this.updateFAQUseCase.execute({ id: item.id, order: item.order }))
    );
    return { success: true };
  }
}