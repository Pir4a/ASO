import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Invoice as TypeOrmInvoice } from '../entities/invoice.entity';
import { Invoice as DomainInvoice } from '../../../../domain/entities/invoice.entity';
import { InvoiceRepository } from '../../../../domain/repositories/invoice.repository.interface';

@Injectable()
export class TypeOrmInvoiceRepository implements InvoiceRepository {
  private readonly repository: Repository<TypeOrmInvoice>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmInvoice);
  }

  async findByOrderId(orderId: string): Promise<DomainInvoice | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<DomainInvoice | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(invoice: DomainInvoice): Promise<DomainInvoice> {
    const entity = this.toPersistence(invoice);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(invoice: DomainInvoice): Promise<DomainInvoice> {
    const entity = this.toPersistence(invoice);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: TypeOrmInvoice): DomainInvoice {
    return new DomainInvoice({
      id: entity.id,
      orderId: entity.orderId,
      invoiceNumber: entity.invoiceNumber,
      issuedAt: entity.issuedAt,
      status: entity.status as any,
      pdfPath: entity.pdfPath,
      dataSnapshot: entity.dataSnapshot,
      history: entity.history,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toPersistence(domain: DomainInvoice): TypeOrmInvoice {
    const entity = new TypeOrmInvoice();
    entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.invoiceNumber = domain.invoiceNumber;
    entity.issuedAt = domain.issuedAt;
    entity.status = domain.status;
    entity.pdfPath = domain.pdfPath;
    entity.dataSnapshot = domain.dataSnapshot;
    entity.history = domain.history || [];
    return entity;
  }
}
