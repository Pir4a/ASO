import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';
import {
  PRODUCT_REPOSITORY_TOKEN,
  type ProductRepository,
} from '../../../domain/repositories/product.repository.interface';
import { resolveStockNotifyEmail } from './stock-notify-email';

type JwtUser = { sub: string; email: string };

@Injectable()
export class SubscribeProductStockNotifyUseCase {
  private readonly logger = new Logger(SubscribeProductStockNotifyUseCase.name);

  constructor(
    @InjectRepository(ProductStockNotification)
    private readonly notifications: Repository<ProductStockNotification>,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    @Inject(EMAIL_GATEWAY)
    private readonly emailGateway: EmailGateway,
  ) {}

  async execute(input: {
    productId: string;
    emailFromBody?: string;
    user?: JwtUser;
  }): Promise<{ ok: true; duplicate: boolean }> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) throw new NotFoundException('Produit introuvable.');
    const out =
      product.stock <= 0 || product.status === 'out_of_stock';
    if (!out) {
      throw new BadRequestException('PRODUCT_IN_STOCK');
    }

    const email = resolveStockNotifyEmail({
      emailFromBody: input.emailFromBody,
      user: input.user,
    });
    if (!email) {
      throw new BadRequestException('EMAIL_REQUIRED');
    }
    const userId = input.user?.sub ?? null;

    const existing = await this.notifications.findOne({
      where: { productId: input.productId, email },
    });
    if (existing) return { ok: true, duplicate: true };

    await this.notifications.save(
      this.notifications.create({
        productId: input.productId,
        email,
        userId,
      }),
    );

    try {
      await this.emailGateway.sendStockNotifyConfirmationEmail(
        email,
        product.name,
        product.slug,
      );
    } catch (e) {
      this.logger.warn(
        `Stock notify confirmation email failed for ${email} / ${product.slug}: ${(e as Error).message}`,
      );
    }

    return { ok: true, duplicate: false };
  }
}
