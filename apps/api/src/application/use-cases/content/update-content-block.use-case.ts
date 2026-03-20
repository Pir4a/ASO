import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../../../infrastructure/persistence/typeorm/entities/content-block.entity';

export interface UpdateContentBlockCommand {
  id: string;
  type?: ContentBlock['type'];
  payload?: Record<string, unknown>;
  order?: number;
}

@Injectable()
export class UpdateContentBlockUseCase {
  constructor(
    @InjectRepository(ContentBlock)
    private readonly repo: Repository<ContentBlock>,
  ) {}

  async execute(command: UpdateContentBlockCommand): Promise<ContentBlock> {
    const { id, ...updates } = command;
    const contentBlock = await this.repo.findOne({ where: { id } });

    if (!contentBlock) {
      throw new NotFoundException(`Content block with ID "${id}" not found`);
    }

    Object.assign(contentBlock, updates);
    return this.repo.save(contentBlock);
  }
}