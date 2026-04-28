import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';
import { formatOrderNumber } from '../orders/get-order-details.use-case';

@Injectable()
export class ResendInvoiceEmailUseCase {
    constructor(
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(EMAIL_GATEWAY)
        private readonly emailGateway: EmailGateway,
        private readonly pdfService: PdfService,
    ) { }

    async execute(invoiceId: string, overrideEmail?: string): Promise<{ ok: true; sentTo: string }> {
        const invoice = await this.invoiceRepository.findById(invoiceId);
        if (!invoice) throw new NotFoundException('Invoice not found');

        let recipient = overrideEmail ?? null;
        if (!recipient && invoice.userId) {
            const user = await this.userRepository.findById(invoice.userId);
            recipient = user?.email ?? null;
        }
        if (!recipient) {
            throw new NotFoundException('No recipient email available for this invoice');
        }

        const order = await this.orderRepository.findById(invoice.orderId);
        let pdfBuffer: Buffer | null = null;
        if (invoice.pdfUrl) {
            pdfBuffer = await this.pdfService.readPersistedInvoicePdf(invoice.pdfUrl);
        }
        if (!pdfBuffer && order) {
            pdfBuffer = await this.pdfService.generateInvoice(order);
        }
        if (!pdfBuffer) {
            throw new NotFoundException('Order for invoice not found, cannot regenerate PDF');
        }

        const orderNumber = order
            ? (order.orderNumber ?? formatOrderNumber(order.id, order.createdAt))
            : undefined;
        await this.emailGateway.sendInvoiceEmail(recipient, invoice.number, pdfBuffer, orderNumber);

        return { ok: true, sentTo: recipient };
    }
}
