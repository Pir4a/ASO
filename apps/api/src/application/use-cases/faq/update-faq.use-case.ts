import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FAQ } from '../../../domain/entities/faq.entity';
import { FAQ_REPOSITORY_TOKEN } from '../../../domain/repositories/faq.repository.interface';
import type { FAQRepository } from '../../../domain/repositories/faq.repository.interface';

export interface UpdateFAQCommand {
  id: string;
  question?: string;
  answer?: string;
  status?: 'active' | 'inactive';
  order?: number;
}

@Injectable()
export class UpdateFAQUseCase {
  constructor(
    @Inject(FAQ_REPOSITORY_TOKEN)
    private readonly faqRepository: FAQRepository,
  ) {}

  async execute(command: UpdateFAQCommand): Promise<FAQ> {
    const { id, ...updates } = command;
    const faq = await this.faqRepository.update(id, updates);

    if (!faq) {
      throw new NotFoundException(`FAQ with ID "${id}" not found`);
    }

    return faq;
  }
}