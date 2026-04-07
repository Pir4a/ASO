import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateContactMessageUseCase } from '../../../application/use-cases/contact/create-contact-message.use-case';
import { GetContactMessagesUseCase } from '../../../application/use-cases/contact/get-contact-messages.use-case';
import { Roles } from '../../auth/roles.decorator';
import { CreateContactMessageDto } from '../../dto/contact/contact-message.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly createContactMessageUseCase: CreateContactMessageUseCase,
    private readonly getContactMessagesUseCase: GetContactMessagesUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateContactMessageDto) {
    const message = await this.createContactMessageUseCase.execute(body);
    return {
      id: message.id,
      subject: message.subject,
      email: message.email,
      createdAt: message.createdAt,
      message: 'Message envoyé. Nous vous répondrons rapidement.',
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAllForAdmin() {
    return this.getContactMessagesUseCase.execute();
  }
}
