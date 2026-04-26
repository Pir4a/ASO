export type InvoiceStatus = 'paid' | 'cancelled';

export class Invoice {
    id: string;
    number: string;
    orderId: string;
    userId: string | null;
    totalHtCents: number;
    totalTvaCents: number;
    totalTtcCents: number;
    currency: string;
    status: InvoiceStatus;
    issuedAt: Date;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<Invoice>) {
        Object.assign(this, partial);
    }
}
