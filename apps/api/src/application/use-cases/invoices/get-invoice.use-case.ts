import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

@Injectable()
export class GetInvoiceUseCase {
    constructor(
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
    ) { }

    async execute(id: string): Promise<Invoice> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) throw new NotFoundException('Invoice not found');
        return invoice;
    }
}
