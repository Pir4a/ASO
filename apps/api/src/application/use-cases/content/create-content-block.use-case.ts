import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../../../infrastructure/persistence/typeorm/entities/content-block.entity';

export interface CreateContentBlockCommand {
  type: ContentBlock['type'];
  payload?: Record<string, unknown>;
  order?: number;
}

@Injectable()
export class CreateContentBlockUseCase {
  constructor(
    @InjectRepository(ContentBlock)
    private readonly repo: Repository<ContentBlock>,
  ) {}

  async execute(command: CreateContentBlockCommand) {
    const contentBlock = this.repo.create({
      type: command.type,
      payload: command.payload,
      order: command.order ?? 0,
    });

    return this.repo.save(contentBlock);
  }
}
