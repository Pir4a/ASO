import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

export interface InvoiceListFilters {
    status?: InvoiceStatus;
    userId?: string;
    orderId?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface InvoiceListResult {
    rows: { invoice: Invoice; customerEmail: string | null }[];
    total: number;
}

export interface InvoiceRepository {
    create(invoice: Invoice): Promise<Invoice>;
    update(invoice: Invoice): Promise<Invoice>;
    findById(id: string): Promise<Invoice | null>;
    findByOrderId(orderId: string): Promise<Invoice | null>;
    findByNumber(number: string): Promise<Invoice | null>;
    countByDate(date: Date): Promise<number>;
    list(params: { skip: number; take: number; filters: InvoiceListFilters }): Promise<InvoiceListResult>;
}

export const INVOICE_REPOSITORY_TOKEN = 'InvoiceRepository';
