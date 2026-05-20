import { CreditNote } from '../entities/credit-note.entity';

export interface CreditNoteFilters {
    page?: number;
    pageSize?: number;
    invoiceId?: string;
    reason?: string;
    search?: string;
}

export interface CreditNoteListRow {
    creditNote: CreditNote;
    invoiceNumber: string | null;
    customerEmail: string | null;
}

export interface PaginatedCreditNotes {
    items: CreditNoteListRow[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CreditNoteRepository {
    create(creditNote: CreditNote): Promise<CreditNote>;
    findById(id: string): Promise<CreditNote | null>;
    findByInvoiceId(invoiceId: string): Promise<CreditNote | null>;
    findAll(filters: CreditNoteFilters): Promise<PaginatedCreditNotes>;
    nextSequenceForDay(prefix: string): Promise<number>;
}

export const CREDIT_NOTE_REPOSITORY_TOKEN = 'CreditNoteRepository';
