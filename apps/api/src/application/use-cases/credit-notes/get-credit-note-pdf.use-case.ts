import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { PdfService } from '../../../infrastructure/services/pdf.service';

export interface CreditNotePdfPayload {
    buffer: Buffer;
    creditNoteNumber: string;
    filename: string;
}

@Injectable()
export class GetCreditNotePdfUseCase {
    constructor(
        @Inject(CREDIT_NOTE_REPOSITORY_TOKEN)
        private readonly creditNotes: CreditNoteRepository,
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoices: InvoiceRepository,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orders: OrderRepository,
        private readonly pdfService: PdfService,
    ) { }

    async execute(id: string): Promise<CreditNotePdfPayload> {
        const creditNote = await this.creditNotes.findById(id);
        if (!creditNote) throw new NotFoundException('Avoir introuvable.');

        if (creditNote.pdfUrl) {
            const persisted = await this.pdfService.readPersistedInvoicePdf(creditNote.pdfUrl);
            if (persisted) {
                return {
                    buffer: persisted,
                    creditNoteNumber: creditNote.number,
                    filename: `${creditNote.number}.pdf`,
                };
            }
        }

        const invoice = await this.invoices.findById(creditNote.invoiceId);
        if (!invoice) throw new NotFoundException('Facture associée introuvable.');
        const order = await this.orders.findById(invoice.orderId);
        if (!order) throw new NotFoundException('Commande associée introuvable.');

        const buffer = await this.pdfService.generateCreditNotePdf(creditNote, order);
        return {
            buffer,
            creditNoteNumber: creditNote.number,
            filename: `${creditNote.number}.pdf`,
        };
    }
}
