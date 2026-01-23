import { Inject, Injectable } from '@nestjs/common';
import { FAQ } from '../../../domain/entities/faq.entity';
import { FAQ_REPOSITORY_TOKEN } from '../../../domain/repositories/faq.repository.interface';
import type { FAQRepository } from '../../../domain/repositories/faq.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export interface CreateFAQCommand {
  question: string;
  answer: string;
  status?: 'active' | 'inactive';
  order?: number;
}

@Injectable()
export class CreateFAQUseCase {
  constructor(
    @Inject(FAQ_REPOSITORY_TOKEN)
    private readonly faqRepository: FAQRepository,
  ) {}

  async execute(command: CreateFAQCommand): Promise<FAQ> {
    const faq = new FAQ({
      id: uuidv4(),
      question: command.question,
      answer: command.answer,
      status: command.status || 'active',
      order: command.order || 0,
      viewCount: 0,
      helpfulCount: 0,
    });

    return this.faqRepository.create(faq);
  }
}