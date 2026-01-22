import { Invoice } from '../entities/invoice.entity';

export interface InvoiceRepository {
  findByOrderId(orderId: string): Promise<Invoice | null>;
  findById(id: string): Promise<Invoice | null>;
  create(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
}

export const INVOICE_REPOSITORY_TOKEN = 'InvoiceRepository';
