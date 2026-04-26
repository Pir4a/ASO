import { Inject, Injectable, Logger } from '@nestjs/common';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { Order } from '../../../domain/entities/order.entity';
import { PdfService } from '../../../infrastructure/services/pdf.service';

const DEFAULT_VAT_RATE = 0.2;

@Injectable()
export class GenerateInvoiceOnPaymentUseCase {
    private readonly logger = new Logger(GenerateInvoiceOnPaymentUseCase.name);

    constructor(
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
        private readonly pdfService: PdfService,
    ) { }

    async execute(order: Order): Promise<{ invoice: Invoice; pdfBuffer: Buffer | null } | null> {
        const existing = await this.invoiceRepository.findByOrderId(order.id);
        if (existing) return { invoice: existing, pdfBuffer: null };

        const issuedAt = new Date();
        const number = await this.generateNumber(issuedAt);

        const totalTtcCents = Math.round(Number(order.total) * 100);
        const totalHtCents = Math.round(totalTtcCents / (1 + DEFAULT_VAT_RATE));
        const totalTvaCents = totalTtcCents - totalHtCents;

        const draft = new Invoice({
            number,
            orderId: order.id,
            userId: order.userId ?? null,
            totalHtCents,
            totalTvaCents,
            totalTtcCents,
            currency: order.currency || 'EUR',
            status: 'paid',
            issuedAt,
            pdfUrl: null,
        });

        const saved = await this.invoiceRepository.create(draft);

        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await this.pdfService.generateInvoice(order);
            const pdfUrl = await this.pdfService.persistInvoicePdf(saved.id, pdfBuffer);
            saved.pdfUrl = pdfUrl;
            await this.invoiceRepository.update(saved);
        } catch (e) {
            this.logger.warn(
                `Invoice ${saved.number} created but PDF persistence failed: ${(e as Error).message}`,
            );
        }

        return { invoice: saved, pdfBuffer };
    }

    private async generateNumber(issuedAt: Date): Promise<string> {
        const yyyy = issuedAt.getUTCFullYear();
        const mm = String(issuedAt.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(issuedAt.getUTCDate()).padStart(2, '0');
        const countToday = await this.invoiceRepository.countByDate(issuedAt);
        const seq = String(countToday + 1).padStart(4, '0');
        return `INV-${yyyy}${mm}${dd}-${seq}`;
    }
}
