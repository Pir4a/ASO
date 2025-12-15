import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../entities/content-block.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentBlock)
    private readonly repo: Repository<ContentBlock>,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC' } });
  }
}
