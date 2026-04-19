import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../../../infrastructure/persistence/typeorm/entities/content-block.entity';

@Injectable()
export class GetContentUseCase {
    constructor(
        @InjectRepository(ContentBlock)
        private readonly repo: Repository<ContentBlock>,
    ) { }

    async execute() {
        const all = await this.repo.find({ order: { order: 'ASC' } });
        // Hard cap: at most 3 carousel slides surfaced on the homepage even if
        // additional rows exist in the database.
        const seen: Record<string, number> = { carousel: 0 };
        const MAX_CAROUSEL = 3;
        return all.filter((block) => {
            if (block.type === 'carousel') {
                seen.carousel = (seen.carousel ?? 0) + 1;
                return seen.carousel <= MAX_CAROUSEL;
            }
            return true;
        });
    }
}
