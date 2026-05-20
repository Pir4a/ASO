import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CountUnreadContactMessagesUseCase } from '../../../application/use-cases/contact/count-unread-contact-messages.use-case';
import { CreateContactMessageUseCase } from '../../../application/use-cases/contact/create-contact-message.use-case';
import { GetContactMessagesUseCase } from '../../../application/use-cases/contact/get-contact-messages.use-case';
import { MarkContactMessageReadUseCase } from '../../../application/use-cases/contact/mark-contact-message-read.use-case';
import { Roles } from '../../auth/roles.decorator';
import { CreateContactMessageDto } from '../../dto/contact/contact-message.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly createContactMessageUseCase: CreateContactMessageUseCase,
    private readonly getContactMessagesUseCase: GetContactMessagesUseCase,
    private readonly markContactMessageReadUseCase: MarkContactMessageReadUseCase,
    private readonly countUnreadContactMessagesUseCase: CountUnreadContactMessagesUseCase,
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

  // CDC XVI.1 — feeds the sidebar badge. Returned as an object so we can later
  // bolt on other "non traités" metrics without breaking the contract.
  @Get('admin/unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async unreadCount() {
    return this.countUnreadContactMessagesUseCase.execute();
  }

  @Patch('admin/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async markAsRead(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.markContactMessageReadUseCase.execute(id);
  }
}
