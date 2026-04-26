import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreditNote, CreditNoteReason } from '../../../domain/entities/credit-note.entity';
import {
    CREDIT_NOTE_REPOSITORY_TOKEN,
    type CreditNoteRepository,
} from '../../../domain/repositories/credit-note.repository.interface';
import {
    INVOICE_REPOSITORY_TOKEN,
    type InvoiceRepository,
} from '../../../domain/repositories/invoice.repository.interface';
import {
    ORDER_REPOSITORY_TOKEN,
    type OrderRepository,
} from '../../../domain/repositories/order.repository.interface';

/** Build "AVO-YYYYMMDD-XXXX" with a zero-padded daily sequence. */
export function formatCreditNoteNumber(seq: number, date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const tail = String(seq).padStart(4, '0');
    return `AVO-${y}${m}${d}-${tail}`;
}

export function creditNotePrefix(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `AVO-${y}${m}${d}-`;
}

export interface CancelInvoiceParams {
    invoiceId: string;
    reason?: CreditNoteReason;
}

/**
 * Soft-cancels an invoice and creates the mirror credit note (AVO-…) in one
 * shot. Idempotent: if a credit note already exists for the invoice, that
 * existing one is returned and no further state changes are made.
 */
@Injectable()
export class CancelInvoiceUseCase {
    private readonly logger = new Logger(CancelInvoiceUseCase.name);

    constructor(
        @Inject(CREDIT_NOTE_REPOSITORY_TOKEN)
        private readonly creditNotes: CreditNoteRepository,
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoices: InvoiceRepository,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orders: OrderRepository,
    ) { }

    async execute(params: CancelInvoiceParams): Promise<CreditNote> {
        const invoice = await this.invoices.findById(params.invoiceId);
        if (!invoice) {
            throw new NotFoundException('Facture introuvable.');
        }

        const existing = await this.creditNotes.findByInvoiceId(invoice.id);
        if (existing) return existing;

        if (invoice.status !== 'cancelled') {
            invoice.status = 'cancelled';
            await this.invoices.update(invoice);
        }

        // Best-effort: cancel the underlying order so it disappears from the
        // customer's "active" view. Failure here doesn't block AVO creation.
        try {
            const order = await this.orders.findById(invoice.orderId);
            if (order && order.status !== 'cancelled') {
                await this.orders.updateStatus(order.id, 'cancelled');
            }
        } catch (e) {
            this.logger.warn(
                `cancel-invoice: failed to cancel underlying order ${invoice.orderId}: ${(e as Error).message}`,
            );
        }

        const issuedAt = new Date();
        const prefix = creditNotePrefix(issuedAt);
        const seq = await this.creditNotes.nextSequenceForDay(prefix);
        const number = formatCreditNoteNumber(seq, issuedAt);

        const created = await this.creditNotes.create(
            new CreditNote({
                number,
                invoiceId: invoice.id,
                userId: invoice.userId ?? null,
                amountTtcCents: -Math.abs(invoice.totalTtcCents),
                currency: invoice.currency || 'EUR',
                reason: params.reason ?? 'cancellation',
                issuedAt,
                pdfUrl: null,
            }),
        );

        return created;
    }
}
