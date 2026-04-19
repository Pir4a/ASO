import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentBlock } from '../../persistence/typeorm/entities/content-block.entity';
import { GetContentUseCase } from '../../../application/use-cases/content/get-content.use-case';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
    CreateContentBlockDto,
    ReorderContentDto,
    UpdateContentBlockDto,
} from '../../dto/content/content-block-admin.dto';

export const MAX_CAROUSEL_SLIDES = 3;

@Controller('content')
export class ContentController {
    constructor(
        private readonly getContentUseCase: GetContentUseCase,
        @InjectRepository(ContentBlock)
        private readonly repo: Repository<ContentBlock>,
    ) { }

    @Get()
    findAll() {
        return this.getContentUseCase.execute();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() body: CreateContentBlockDto) {
        if (body.type === 'carousel') {
            const existing = await this.repo.count({ where: { type: 'carousel' } });
            if (existing >= MAX_CAROUSEL_SLIDES) {
                throw new BadRequestException(
                    `Le carrousel est limité à ${MAX_CAROUSEL_SLIDES} diapositives.`,
                );
            }
        }
        if (body.type === 'homepage_text') {
            const existing = await this.repo.count({ where: { type: 'homepage_text' } });
            if (existing >= 1) {
                throw new BadRequestException(
                    'Un seul bloc "homepage_text" est autorisé. Éditez le bloc existant.',
                );
            }
        }

        const order = body.order ?? (await this.nextOrderForType(body.type));
        const entity = this.repo.create({
            type: body.type,
            payload: body.payload ?? {},
            order,
        });
        return this.repo.save(entity);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('reorder/list')
    async reorder(@Body() body: ReorderContentDto) {
        const ids = body.items.map((i) => i.id);
        if (ids.length === 0) return { success: true };

        const blocks = await this.repo.find({ where: { id: In(ids) } });
        const byId = new Map(blocks.map((b) => [b.id, b]));
        for (const item of body.items) {
            const block = byId.get(item.id);
            if (!block) continue;
            block.order = item.order;
            await this.repo.save(block);
        }
        return { success: true };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateContentBlockDto) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Bloc introuvable.');

        if (body.type && body.type !== existing.type && body.type === 'carousel') {
            const carouselCount = await this.repo.count({ where: { type: 'carousel' } });
            if (carouselCount >= MAX_CAROUSEL_SLIDES) {
                throw new BadRequestException(
                    `Le carrousel est limité à ${MAX_CAROUSEL_SLIDES} diapositives.`,
                );
            }
        }

        if (body.type) existing.type = body.type;
        if (body.payload !== undefined) {
            existing.payload = { ...(existing.payload ?? {}), ...body.payload };
        }
        if (body.order !== undefined) existing.order = body.order;

        return this.repo.save(existing);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Bloc introuvable.');
        await this.repo.delete(id);
        return { success: true };
    }

    private async nextOrderForType(type: string): Promise<number> {
        const last = await this.repo.findOne({
            where: { type: type as ContentBlock['type'] },
            order: { order: 'DESC' },
        });
        return last ? last.order + 1 : 0;
    }
}
