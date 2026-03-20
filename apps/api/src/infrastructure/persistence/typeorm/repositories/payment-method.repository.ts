import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaymentMethod as TypeOrmPaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethod as DomainPaymentMethod } from '../../../../domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '../../../../domain/repositories/payment-method.repository.interface';

@Injectable()
export class TypeOrmPaymentMethodRepository implements PaymentMethodRepository {
  private readonly repository: Repository<TypeOrmPaymentMethod>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPaymentMethod);
  }

  async findByUserId(userId: string): Promise<DomainPaymentMethod[]> {
    const entities = await this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByProviderPaymentMethodId(providerPaymentMethodId: string): Promise<DomainPaymentMethod | null> {
    const entity = await this.repository.findOne({ where: { providerPaymentMethodId } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(paymentMethod: DomainPaymentMethod): Promise<DomainPaymentMethod> {
    const entity = this.toPersistence(paymentMethod);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async deleteByProviderPaymentMethodId(providerPaymentMethodId: string): Promise<void> {
    await this.repository.delete({ providerPaymentMethodId });
  }

  private toDomain(entity: TypeOrmPaymentMethod): DomainPaymentMethod {
    return new DomainPaymentMethod({
      id: entity.id,
      userId: entity.userId,
      provider: entity.provider,
      providerPaymentMethodId: entity.providerPaymentMethodId,
      brand: entity.brand,
      last4: entity.last4,
      expMonth: entity.expMonth,
      expYear: entity.expYear,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toPersistence(domain: DomainPaymentMethod): TypeOrmPaymentMethod {
    const entity = new TypeOrmPaymentMethod();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.provider = domain.provider || 'stripe';
    entity.providerPaymentMethodId = domain.providerPaymentMethodId;
    entity.brand = domain.brand;
    entity.last4 = domain.last4;
    entity.expMonth = domain.expMonth;
    entity.expYear = domain.expYear;
    return entity;
  }
}
