import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @MinLength(1)
    street: string;

    @IsString()
    @MinLength(1)
    city: string;

    @IsString()
    @MinLength(1)
    postalCode: string;

    @IsString()
    @MinLength(1)
    country: string;

    @IsOptional()
    @IsString()
    phone?: string;
}

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    street?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    city?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    postalCode?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    country?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
