import { IsEmail, IsOptional } from 'class-validator';

export class SendCreditNoteEmailDto {
    @IsOptional()
    @IsEmail()
    overrideEmail?: string;
}

export class CancelInvoiceDto {
    @IsOptional()
    reason?: 'cancellation' | 'refund' | 'error';
}
