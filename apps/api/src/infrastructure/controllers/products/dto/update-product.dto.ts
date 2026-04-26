import {
  IsBoolean,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsObject,
  IsString,
  MaxLength,
  Min,
  IsIn,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @IsIn([0, 5.5, 10, 20], { message: 'TVA autorisée : 0, 5.5, 10 ou 20 %.' })
  vatRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  featuredOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  listPriority?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @IsOptional()
  @IsObject()
  specs?: Record<string, string>;
}
