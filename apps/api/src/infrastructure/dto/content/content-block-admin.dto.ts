import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const CONTENT_TYPES = ['carousel', 'homepage_text', 'category_image'] as const;
export type AdminContentType = (typeof CONTENT_TYPES)[number];

export class CreateContentBlockDto {
  @IsString()
  @IsIn(CONTENT_TYPES as unknown as string[])
  type: AdminContentType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateContentBlockDto {
  @IsOptional()
  @IsString()
  @IsIn(CONTENT_TYPES as unknown as string[])
  type?: AdminContentType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class ContentOrderItemDto {
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderContentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentOrderItemDto)
  items: ContentOrderItemDto[];
}
