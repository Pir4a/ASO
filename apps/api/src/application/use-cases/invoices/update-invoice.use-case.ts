import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice, InvoiceStatus } from '../../../domain/entities/invoice.entity';

export interface UpdateInvoiceInput {
    status?: InvoiceStatus;
    totalHtCents?: number;
    totalTvaCents?: number;
    totalTtcCents?: number;
    currency?: string;
}

const ALLOWED_STATUSES: InvoiceStatus[] = ['paid', 'cancelled'];

@Injectable()
export class UpdateInvoiceUseCase {
    constructor(
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
    ) { }

    async execute(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) throw new NotFoundException('Invoice not found');

        if (input.status !== undefined) {
            if (!ALLOWED_STATUSES.includes(input.status)) {
                throw new BadRequestException(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
            }
            invoice.status = input.status;
        }
        if (input.totalHtCents !== undefined) invoice.totalHtCents = input.totalHtCents;
        if (input.totalTvaCents !== undefined) invoice.totalTvaCents = input.totalTvaCents;
        if (input.totalTtcCents !== undefined) invoice.totalTtcCents = input.totalTtcCents;
        if (input.currency !== undefined) invoice.currency = input.currency.toUpperCase();

        return this.invoiceRepository.update(invoice);
    }
}
