import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';
import { InvoiceStorageService } from '../../../infrastructure/services/invoice-storage.service';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

@Injectable()
export class GenerateInvoicePdfUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
        private readonly pdfService: PdfService,
        private readonly invoiceStorage: InvoiceStorageService,
    ) { }

    async execute(orderId: string, userId: string): Promise<Buffer> {
        const order = await this.orderRepository.findOneByIdAndUserId(orderId, userId);

        if (!order) {
            const existingOrder = await this.orderRepository.findById(orderId);
            if (existingOrder) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
            }
            throw new NotFoundException('Commande introuvable.');
        }

        let invoice = await this.invoiceRepository.findByOrderId(orderId);
        if (!invoice) {
            invoice = await this.invoiceRepository.create(new Invoice({
                orderId: order.id,
                invoiceNumber: this.generateInvoiceNumber(order.id),
                issuedAt: new Date(),
                status: 'active',
                dataSnapshot: this.buildSnapshot(order),
                history: [],
            }));
        }

        const pdfBuffer = await this.pdfService.generateInvoice(order, {
            invoiceNumber: invoice.invoiceNumber,
            issuedAt: invoice.issuedAt,
            seller: invoice.dataSnapshot?.seller,
            buyer: invoice.dataSnapshot?.buyer,
            notes: invoice.dataSnapshot?.notes,
        });

        const pdfPath = await this.invoiceStorage.saveInvoicePdf(invoice.invoiceNumber, pdfBuffer);
        if (invoice.pdfPath !== pdfPath) {
            invoice.pdfPath = pdfPath;
            await this.invoiceRepository.update(invoice);
        }

        return pdfBuffer;
    }

    private generateInvoiceNumber(orderId: string): string {
        const date = new Date();
        const year = date.getFullYear();
        const short = orderId.replace(/-/g, '').slice(0, 6).toUpperCase();
        const sequence = Date.now().toString().slice(-5);
        return `INV-${year}-${short}-${sequence}`;
    }

    private buildSnapshot(order: any): Record<string, any> {
        const address = order.shippingAddress || {};
        const addressLines: string[] = [];
        const buyerName = address.name || [address.firstName, address.lastName].filter(Boolean).join(' ');
        if (buyerName) addressLines.push(buyerName);
        if (address.street) addressLines.push(address.street);
        if (address.line1) addressLines.push(address.line1);
        if (address.line2) addressLines.push(address.line2);
        const postal = address.postalCode || address.postal_code || '';
        const city = address.city || '';
        if (postal || city) addressLines.push(`${postal} ${city}`.trim());
        if (address.country) addressLines.push(address.country);

        return {
            seller: {
                name: process.env.COMPANY_NAME || 'Althea Systems',
                addressLines: [
                    process.env.COMPANY_ADDRESS_LINE1 || 'Adresse société',
                    process.env.COMPANY_ADDRESS_LINE2 || '75000 Paris, France',
                ].filter(Boolean),
                email: process.env.COMPANY_EMAIL || 'contact@althea.local',
                phone: process.env.COMPANY_PHONE,
                vatNumber: process.env.COMPANY_VAT_NUMBER,
                siret: process.env.COMPANY_SIRET,
                rcs: process.env.COMPANY_RCS,
                legalMentions: process.env.COMPANY_LEGAL_MENTIONS,
            },
            buyer: {
                name: buyerName,
                addressLines,
            },
            notes: process.env.INVOICE_NOTES,
        };
    }
}
