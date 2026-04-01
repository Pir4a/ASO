import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryOrderItemDto {
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItemDto)
  items: CategoryOrderItemDto[];
}

export class BulkCategoryActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsString()
  @IsIn(['activate', 'deactivate', 'delete'])
  action: 'activate' | 'deactivate' | 'delete';
}
