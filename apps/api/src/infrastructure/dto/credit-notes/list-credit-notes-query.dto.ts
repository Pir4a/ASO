import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCreditNotesQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize?: number;

    @IsOptional()
    @IsString()
    invoiceId?: string;

    @IsOptional()
    @IsIn(['cancellation', 'refund', 'error'])
    reason?: 'cancellation' | 'refund' | 'error';

    @IsOptional()
    @IsString()
    search?: string;
}
