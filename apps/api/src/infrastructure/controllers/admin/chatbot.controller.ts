import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CHAT_CONVERSATION_REPOSITORY_TOKEN } from '../../../domain/repositories/chat-conversation.repository.interface';
import type { ChatConversationRepository } from '../../../domain/repositories/chat-conversation.repository.interface';
import { Inject } from '@nestjs/common';

@Controller('admin/chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminChatbotController {
  constructor(
    @Inject(CHAT_CONVERSATION_REPOSITORY_TOKEN)
    private readonly conversationRepository: ChatConversationRepository,
  ) {}

  @Get('conversations/active')
  async getActiveConversations() {
    return this.conversationRepository.findActiveConversations();
  }

  @Get('conversations/escalated')
  async getEscalatedConversations() {
    return this.conversationRepository.findEscalatedConversations();
  }

  @Patch('conversations/:id/status')
  async updateConversationStatus(
    @Body('id') id: string,
    @Body('status') status: string,
    @Body('escalatedTo') escalatedTo?: string,
  ) {
    return this.conversationRepository.updateStatus(id, status, escalatedTo);
  }
}