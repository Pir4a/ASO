export type FAQStatus = 'active' | 'inactive';

export class FAQ {
  id: string;
  question: string;
  answer: string;
  status: FAQStatus;
  order: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<FAQ>) {
    Object.assign(this, partial);
  }
}