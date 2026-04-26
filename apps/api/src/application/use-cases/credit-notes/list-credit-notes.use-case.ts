import { Inject, Injectable } from '@nestjs/common';
import {
    CREDIT_NOTE_REPOSITORY_TOKEN,
    type CreditNoteFilters,
    type CreditNoteRepository,
    type PaginatedCreditNotes,
} from '../../../domain/repositories/credit-note.repository.interface';

export interface ListCreditNotesParams {
    page?: number;
    pageSize?: number;
    filters?: CreditNoteFilters;
}

@Injectable()
export class ListCreditNotesUseCase {
    constructor(
        @Inject(CREDIT_NOTE_REPOSITORY_TOKEN)
        private readonly creditNotes: CreditNoteRepository,
    ) { }

    async execute(params: ListCreditNotesParams = {}): Promise<PaginatedCreditNotes> {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
        return this.creditNotes.findAll({ ...(params.filters ?? {}), page, pageSize });
    }
}
