import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../../../infrastructure/persistence/typeorm/entities/content-block.entity';

@Injectable()
export class UpdateHomepageContentUseCase {
  constructor(
    @InjectRepository(ContentBlock)
    private readonly repo: Repository<ContentBlock>,
  ) {}

  async execute(updates: {
    carousel?: any[];
    hero?: any;
    features?: any;
    cta?: any;
    featuredProducts?: any;
    featuredCategories?: any;
  }): Promise<{ success: true }> {
    const updatePromises: Promise<any>[] = [];

    // Handle carousel updates
    if (updates.carousel) {
      // First delete all existing carousel items
      updatePromises.push(this.repo.delete({ type: 'carousel' }));

      // Then create new ones
      const carouselPromises = updates.carousel.map((item, index) =>
        this.repo.save({
          type: 'carousel',
          payload: item,
          order: index,
        })
      );
      updatePromises.push(...carouselPromises);
    }

    // Handle single content blocks
    const singleBlocks = [
      { type: 'homepage_hero', data: updates.hero },
      { type: 'homepage_features', data: updates.features },
      { type: 'homepage_cta', data: updates.cta },
      { type: 'featured_products', data: updates.featuredProducts },
      { type: 'featured_categories', data: updates.featuredCategories },
    ];

    for (const { type, data } of singleBlocks) {
      if (data) {
        updatePromises.push(
          this.repo.upsert({
            type: type as any,
            payload: data,
            order: 0,
          }, ['type'])
        );
      }
    }

    await Promise.all(updatePromises);
    return { success: true };
  }
}