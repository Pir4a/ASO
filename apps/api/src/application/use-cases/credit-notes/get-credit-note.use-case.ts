import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreditNote } from '../../../domain/entities/credit-note.entity';
import {
    CREDIT_NOTE_REPOSITORY_TOKEN,
    type CreditNoteRepository,
} from '../../../domain/repositories/credit-note.repository.interface';

@Injectable()
export class GetCreditNoteUseCase {
    constructor(
        @Inject(CREDIT_NOTE_REPOSITORY_TOKEN)
        private readonly creditNotes: CreditNoteRepository,
    ) { }

    async execute(id: string): Promise<CreditNote> {
        const found = await this.creditNotes.findById(id);
        if (!found) throw new NotFoundException('Avoir introuvable.');
        return found;
    }
}
