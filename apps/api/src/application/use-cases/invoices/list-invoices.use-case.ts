import { Inject, Injectable } from '@nestjs/common';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type {
    InvoiceListFilters,
    InvoiceListResult,
    InvoiceRepository,
} from '../../../domain/repositories/invoice.repository.interface';

export interface ListInvoicesParams {
    page?: number;
    pageSize?: number;
    filters?: InvoiceListFilters;
}

@Injectable()
export class ListInvoicesUseCase {
    constructor(
        @Inject(INVOICE_REPOSITORY_TOKEN)
        private readonly invoiceRepository: InvoiceRepository,
    ) { }

    async execute(params: ListInvoicesParams = {}): Promise<InvoiceListResult & { page: number; pageSize: number }> {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
        const result = await this.invoiceRepository.list({
            skip: (page - 1) * pageSize,
            take: pageSize,
            filters: params.filters ?? {},
        });
        return { ...result, page, pageSize };
    }
}
