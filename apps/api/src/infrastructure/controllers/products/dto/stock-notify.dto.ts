import { IsEmail, IsOptional, MaxLength } from 'class-validator';

export class StockNotifyDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
