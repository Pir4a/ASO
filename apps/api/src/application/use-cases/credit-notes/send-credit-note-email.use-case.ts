import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EMAIL_GATEWAY, type EmailGateway } from '../../../domain/gateways/email.gateway';
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
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';

const REASON_LABELS: Record<string, string> = {
    cancellation: 'Annulation de commande',
    refund: 'Remboursement',
    error: "Correction d'erreur",
};

@Injectable()
export class SendCreditNoteEmailUseCase {
    constructor(
        @Inject(CREDIT_NOTE_REPOSITORY_TOKEN)
        private readonly creditNotes: CreditNoteRepository,
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoices: InvoiceRepository,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orders: OrderRepository,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly users: UserRepository,
        @Inject(EMAIL_GATEWAY)
        private readonly email: EmailGateway,
        private readonly pdfService: PdfService,
    ) { }

    async execute(creditNoteId: string, overrideEmail?: string): Promise<{ ok: true; sentTo: string }> {
        const creditNote = await this.creditNotes.findById(creditNoteId);
        if (!creditNote) throw new NotFoundException('Avoir introuvable.');

        let recipient = overrideEmail ?? null;
        if (!recipient && creditNote.userId) {
            const user = await this.users.findById(creditNote.userId);
            recipient = user?.email ?? null;
        }
        if (!recipient) {
            throw new BadRequestException("Aucune adresse e-mail disponible pour cet avoir.");
        }

        const invoice = await this.invoices.findById(creditNote.invoiceId);
        if (!invoice) throw new NotFoundException('Facture associée introuvable.');
        const order = await this.orders.findById(invoice.orderId);
        if (!order) throw new NotFoundException('Commande associée introuvable.');

        let pdfBuffer: Buffer | null = null;
        if (creditNote.pdfUrl) {
            pdfBuffer = await this.pdfService.readPersistedInvoicePdf(creditNote.pdfUrl);
        }
        if (!pdfBuffer) {
            pdfBuffer = await this.pdfService.generateCreditNotePdf(creditNote, order);
        }

        await this.email.sendCreditNoteEmail(
            recipient,
            {
                number: creditNote.number,
                invoiceReference: invoice.number,
                amountTtc: creditNote.amountTtcCents / 100,
                currency: creditNote.currency || 'EUR',
                reason: REASON_LABELS[creditNote.reason] ?? creditNote.reason,
                issuedAt: creditNote.issuedAt,
            },
            pdfBuffer,
        );

        return { ok: true, sentTo: recipient };
    }
}
