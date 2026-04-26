import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartChatSessionDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(160)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  subject: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}

export class ChatAdminReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}
