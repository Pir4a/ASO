import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateContactMessageUseCase } from '../../application/use-cases/contact/create-contact-message.use-case';

@Controller('contact')
export class ContactController {
  constructor(private readonly createContactMessageUseCase: CreateContactMessageUseCase) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMessage(@Body() body: { name: string; email: string; subject?: string; message: string }) {
    return this.createContactMessageUseCase.execute(body);
  }
}
