import { CreditNote } from '../entities/credit-note.entity';

export interface CreditNoteRepository {
  create(creditNote: CreditNote): Promise<CreditNote>;
}

export const CREDIT_NOTE_REPOSITORY_TOKEN = 'CreditNoteRepository';
