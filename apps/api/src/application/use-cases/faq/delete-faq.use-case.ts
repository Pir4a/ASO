import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FAQ_REPOSITORY_TOKEN } from '../../../domain/repositories/faq.repository.interface';
import type { FAQRepository } from '../../../domain/repositories/faq.repository.interface';

@Injectable()
export class DeleteFAQUseCase {
  constructor(
    @Inject(FAQ_REPOSITORY_TOKEN)
    private readonly faqRepository: FAQRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.faqRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`FAQ with ID "${id}" not found`);
    }
  }
}