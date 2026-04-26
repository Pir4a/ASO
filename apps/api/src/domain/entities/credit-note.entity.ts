export type CreditNoteReason = 'cancellation' | 'refund' | 'error';

export class CreditNote {
    id: string;
    number: string;
    invoiceId: string;
    userId?: string | null;
    amountTtcCents: number; // Stored as a negative integer (cents)
    currency: string;
    reason: CreditNoteReason;
    issuedAt: Date;
    pdfUrl?: string | null;

    constructor(partial: Partial<CreditNote>) {
        Object.assign(this, partial);
    }
}
