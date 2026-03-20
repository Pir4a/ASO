import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreditNote as TypeOrmCreditNote } from '../entities/credit-note.entity';
import { CreditNote as DomainCreditNote } from '../../../../domain/entities/credit-note.entity';
import { CreditNoteRepository } from '../../../../domain/repositories/credit-note.repository.interface';

@Injectable()
export class TypeOrmCreditNoteRepository implements CreditNoteRepository {
  private readonly repository: Repository<TypeOrmCreditNote>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmCreditNote);
  }

  async create(creditNote: DomainCreditNote): Promise<DomainCreditNote> {
    const entity = new TypeOrmCreditNote();
    entity.id = creditNote.id;
    entity.orderId = creditNote.orderId;
    entity.invoiceId = creditNote.invoiceId;
    entity.creditNoteNumber = creditNote.creditNoteNumber;
    entity.reason = creditNote.reason;
    const saved = await this.repository.save(entity);
    return new DomainCreditNote({
      id: saved.id,
      orderId: saved.orderId,
      invoiceId: saved.invoiceId,
      creditNoteNumber: saved.creditNoteNumber,
      reason: saved.reason,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }
}
