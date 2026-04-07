import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
