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
        return this.repo.find({ order: { order: 'ASC' } });
    }
}
