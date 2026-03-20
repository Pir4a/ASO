export type InvoiceStatus = 'active' | 'voided';

export class Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issuedAt: Date;
  status: InvoiceStatus;
  pdfPath?: string;
  dataSnapshot?: Record<string, any>;
  history?: Array<{ updatedAt: string; changes: Record<string, any> }>;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}
