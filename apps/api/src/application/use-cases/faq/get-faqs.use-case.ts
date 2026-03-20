import { Inject, Injectable } from '@nestjs/common';
import { FAQ } from '../../../domain/entities/faq.entity';
import { FAQ_REPOSITORY_TOKEN } from '../../../domain/repositories/faq.repository.interface';
import type { FAQRepository } from '../../../domain/repositories/faq.repository.interface';

@Injectable()
export class GetFAQsUseCase {
  constructor(
    @Inject(FAQ_REPOSITORY_TOKEN)
    private readonly faqRepository: FAQRepository,
  ) {}

  async execute(includeInactive = false): Promise<FAQ[]> {
    return includeInactive ? this.faqRepository.findAll() : this.faqRepository.findAllActive();
  }
}