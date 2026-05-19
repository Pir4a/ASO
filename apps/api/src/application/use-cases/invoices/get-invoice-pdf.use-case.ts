import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';

export interface InvoicePdfPayload {
    buffer: Buffer;
    invoiceNumber: string;
    filename: string;
}

@Injectable()
export class GetInvoicePdfUseCase {
    constructor(
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        private readonly pdfService: PdfService,
    ) { }

    async execute(id: string): Promise<InvoicePdfPayload> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) throw new NotFoundException('Invoice not found');

        if (invoice.pdfUrl) {
            const persisted = await this.pdfService.readPersistedInvoicePdf(invoice.pdfUrl);
            if (persisted) {
                return {
                    buffer: persisted,
                    invoiceNumber: invoice.number,
                    filename: `facture-${invoice.number}.pdf`,
                };
            }
        }

        const order = await this.orderRepository.findById(invoice.orderId);
        if (!order) throw new NotFoundException('Order for invoice not found');

        const buffer = await this.pdfService.generateInvoice(order, invoice.number);
        return {
            buffer,
            invoiceNumber: invoice.number,
            filename: `facture-${invoice.number}.pdf`,
        };
    }
}
