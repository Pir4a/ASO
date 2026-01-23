import { Inject, Injectable } from '@nestjs/common';
import { FAQ } from '../../../domain/entities/faq.entity';
import { FAQ_REPOSITORY_TOKEN } from '../../../domain/repositories/faq.repository.interface';
import type { FAQRepository } from '../../../domain/repositories/faq.repository.interface';

@Injectable()
export class SearchFAQsUseCase {
  constructor(
    @Inject(FAQ_REPOSITORY_TOKEN)
    private readonly faqRepository: FAQRepository,
  ) {}

  async execute(query: string): Promise<FAQ[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Basic text search - in a real implementation, this would use semantic search
    // or integration with AI services like OpenAI embeddings
    const results = await this.faqRepository.search(query.trim().toLowerCase());

    // Increment view counts for found FAQs
    await Promise.all(
      results.map(faq => this.faqRepository.incrementViewCount(faq.id))
    );

    return results;
  }
}