export class CreditNote {
  id: string;
  orderId: string;
  invoiceId: string;
  creditNoteNumber: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CreditNote>) {
    Object.assign(this, partial);
  }
}
