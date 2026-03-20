import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaymentIntent as TypeOrmPaymentIntent } from '../entities/payment-intent.entity';
import { PaymentIntent as DomainPaymentIntent } from '../../../../domain/entities/payment-intent.entity';
import { PaymentIntentRepository } from '../../../../domain/repositories/payment-intent.repository.interface';

@Injectable()
export class TypeOrmPaymentIntentRepository implements PaymentIntentRepository {
  private readonly repository: Repository<TypeOrmPaymentIntent>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPaymentIntent);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<DomainPaymentIntent | null> {
    const entity = await this.repository.findOne({ where: { idempotencyKey } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<DomainPaymentIntent | null> {
    const entity = await this.repository.findOne({ where: { stripePaymentIntentId } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(paymentIntent: DomainPaymentIntent): Promise<DomainPaymentIntent> {
    const entity = this.toPersistence(paymentIntent);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(paymentIntent: DomainPaymentIntent): Promise<DomainPaymentIntent> {
    const entity = this.toPersistence(paymentIntent);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: TypeOrmPaymentIntent): DomainPaymentIntent {
    return new DomainPaymentIntent({
      id: entity.id,
      orderId: entity.orderId,
      idempotencyKey: entity.idempotencyKey,
      stripePaymentIntentId: entity.stripePaymentIntentId,
      amount: Number(entity.amount),
      currency: entity.currency,
      status: entity.status as any,
      clientSecret: entity.clientSecret,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toPersistence(domain: DomainPaymentIntent): TypeOrmPaymentIntent {
    const entity = new TypeOrmPaymentIntent();
    entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.idempotencyKey = domain.idempotencyKey;
    entity.stripePaymentIntentId = domain.stripePaymentIntentId;
    entity.amount = domain.amount;
    entity.currency = domain.currency;
    entity.status = domain.status;
    entity.clientSecret = domain.clientSecret;
    return entity;
  }
}
