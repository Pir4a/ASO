import { CreditNote as DomainCreditNote, CreditNoteReason } from '../../../../domain/entities/credit-note.entity';
import { CreditNoteOrm } from '../entities/credit-note.entity';

export class CreditNoteMapper {
    static toDomain(entity: CreditNoteOrm): DomainCreditNote {
        return new DomainCreditNote({
            id: entity.id,
            number: entity.number,
            invoiceId: entity.invoiceId,
            userId: entity.userId ?? null,
            amountTtcCents: Number(entity.amountTtcCents),
            currency: entity.currency,
            reason: entity.reason as CreditNoteReason,
            issuedAt: entity.issuedAt,
            pdfUrl: entity.pdfUrl ?? null,
        });
    }

    static toPersistence(domain: DomainCreditNote): CreditNoteOrm {
        const entity = new CreditNoteOrm();
        if (domain.id) entity.id = domain.id;
        entity.number = domain.number;
        entity.invoiceId = domain.invoiceId;
        entity.userId = domain.userId ?? null;
        entity.amountTtcCents = domain.amountTtcCents;
        entity.currency = domain.currency || 'EUR';
        entity.reason = domain.reason;
        if (domain.issuedAt) entity.issuedAt = domain.issuedAt;
        entity.pdfUrl = domain.pdfUrl ?? null;
        return entity;
    }
}
