import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';
import { resolveOrderNumber } from './get-order-details.use-case';

export interface OrderInvoicePdfPayload {
    buffer: Buffer;
    filename: string;
}

@Injectable()
export class GenerateInvoicePdfUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
        private readonly pdfService: PdfService,
    ) { }

    async execute(orderId: string, userId: string): Promise<OrderInvoicePdfPayload> {
        const order = await this.orderRepository.findOneByIdAndUserId(orderId, userId);

        if (!order) {
            const existingOrder = await this.orderRepository.findById(orderId);
            if (existingOrder) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
            }
            throw new NotFoundException('Commande introuvable.');
        }

        const filename = `facture-${resolveOrderNumber(order)}.pdf`;
        const invoice = await this.invoiceRepository.findByOrderId(orderId);

        if (invoice?.pdfUrl) {
            const persisted = await this.pdfService.readPersistedInvoicePdf(invoice.pdfUrl);
            if (persisted) {
                return { buffer: persisted, filename };
            }
        }

        const buffer = await this.pdfService.generateInvoice(
            order,
            invoice?.number,
        );
        return { buffer, filename };
    }
}
