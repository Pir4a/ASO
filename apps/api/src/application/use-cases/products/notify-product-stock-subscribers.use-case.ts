import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';
import {
  PRODUCT_REPOSITORY_TOKEN,
  type ProductRepository,
} from '../../../domain/repositories/product.repository.interface';

@Injectable()
export class NotifyProductStockSubscribersUseCase {
  private readonly logger = new Logger(NotifyProductStockSubscribersUseCase.name);

  constructor(
    @InjectRepository(ProductStockNotification)
    private readonly notifications: Repository<ProductStockNotification>,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    @Inject(EMAIL_GATEWAY)
    private readonly emailGateway: EmailGateway,
  ) {}

  async execute(productId: string): Promise<{ notified: number; failed: number }> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundException('Produit introuvable.');

    const rows = await this.notifications.find({ where: { productId } });
    if (rows.length === 0) return { notified: 0, failed: 0 };

    let notified = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        await this.emailGateway.sendProductBackInStockEmail(
          row.email,
          product.name,
          product.slug,
        );
        notified += 1;
      } catch (e) {
        failed += 1;
        this.logger.warn(
          `Back-in-stock email failed for ${row.email} / ${product.slug}: ${(e as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Back-in-stock emails for ${product.slug}: ${notified} sent, ${failed} failed (${rows.length} subscribers).`,
    );

    return { notified, failed };
  }
}
