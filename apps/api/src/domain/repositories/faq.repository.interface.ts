import { FAQ } from '../entities/faq.entity';

export interface FAQRepository {
  findAll(): Promise<FAQ[]>;
  findAllActive(): Promise<FAQ[]>;
  findById(id: string): Promise<FAQ | null>;
  create(faq: FAQ): Promise<FAQ>;
  update(id: string, updates: Partial<FAQ>): Promise<FAQ | null>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<FAQ[]>;
  incrementViewCount(id: string): Promise<void>;
  incrementHelpfulCount(id: string): Promise<void>;
}

export const FAQ_REPOSITORY_TOKEN = 'FAQRepository';