import { Invoice } from '../../../../domain/entities/invoice.entity';
import { InvoiceOrm } from '../entities/invoice.entity';

export const invoiceToDomain = (orm: InvoiceOrm): Invoice =>
    new Invoice({
        id: orm.id,
        number: orm.number,
        orderId: orm.orderId,
        userId: orm.userId,
        totalHtCents: orm.totalHtCents,
        totalTvaCents: orm.totalTvaCents,
        totalTtcCents: orm.totalTtcCents,
        currency: orm.currency,
        status: orm.status,
        issuedAt: orm.issuedAt,
        pdfUrl: orm.pdfUrl,
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
    });

export const invoiceToPersistence = (domain: Invoice): Partial<InvoiceOrm> => ({
    id: domain.id,
    number: domain.number,
    orderId: domain.orderId,
    userId: domain.userId,
    totalHtCents: domain.totalHtCents,
    totalTvaCents: domain.totalTvaCents,
    totalTtcCents: domain.totalTtcCents,
    currency: domain.currency,
    status: domain.status,
    issuedAt: domain.issuedAt,
    pdfUrl: domain.pdfUrl,
});
