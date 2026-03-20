import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CONTACT_MESSAGE_REPOSITORY_TOKEN } from '../../../domain/repositories/contact-message.repository.interface';
import type { ContactMessageRepository } from '../../../domain/repositories/contact-message.repository.interface';
import { Inject } from '@nestjs/common';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

@Controller('admin/contact-messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminContactMessagesController {
  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY_TOKEN)
    private readonly contactMessageRepository: ContactMessageRepository,
    @Inject(EMAIL_GATEWAY)
    private readonly emailGateway: EmailGateway,
  ) {}

  @Get()
  async getAllMessages(
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    let messages = await this.contactMessageRepository.findAll();

    // Filter by status if provided
    if (status && status !== 'all') {
      messages = messages.filter(msg => msg.status === status);
    }

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      messages = messages.filter(msg =>
        msg.name.toLowerCase().includes(searchLower) ||
        msg.email.toLowerCase().includes(searchLower) ||
        msg.subject?.toLowerCase().includes(searchLower) ||
        msg.message.toLowerCase().includes(searchLower)
      );
    }

    return messages;
  }

  @Get(':id')
  async getMessage(@Param('id') id: string) {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    const message = await this.contactMessageRepository.update(id, { status: status as any });
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  }

  @Post(':id/reply')
  async replyToMessage(
    @Param('id') id: string,
    @Body('reply') reply: string
  ) {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }

    // Update message with reply
    const updatedMessage = await this.contactMessageRepository.update(id, {
      adminReply: reply,
      status: 'replied',
      repliedAt: new Date(),
    });

    // Send reply email to user
    try {
      await this.emailGateway.sendContactReplyEmail(
        message.email,
        message.name,
        message.subject || 'Réponse à votre message',
        reply,
        message.message
      );
    } catch (error) {
      console.error('Failed to send reply email:', error);
      // Don't fail the request if email fails
    }

    return updatedMessage;
  }
}