import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class PatchInvoiceDto {
    @IsOptional()
    @IsIn(['paid', 'cancelled'])
    status?: 'paid' | 'cancelled';

    @IsOptional()
    @IsInt()
    @Min(0)
    totalHtCents?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    totalTvaCents?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    totalTtcCents?: number;

    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;
}

export class ResendInvoiceEmailDto {
    @IsOptional()
    @IsString()
    overrideEmail?: string;
}
