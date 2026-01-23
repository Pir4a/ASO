import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot/chatbot.service';
import { CHAT_CONVERSATION_REPOSITORY_TOKEN } from '../../domain/repositories/chat-conversation.repository.interface';
import type { ChatConversationRepository } from '../../domain/repositories/chat-conversation.repository.interface';
import { ChatConversation } from '../../domain/entities/chat-conversation.entity';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; email: string };
}

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    @Inject(CHAT_CONVERSATION_REPOSITORY_TOKEN)
    private readonly conversationRepository: ChatConversationRepository,
  ) {}

  @Post('message')
  async sendMessage(
    @Body() body: { message: string; sessionId?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const { message, sessionId } = body;
    const userId = req.user?.sub;
    const finalSessionId = sessionId || this.generateSessionId();

    // Save user message
    await this.saveMessage(finalSessionId, userId, message, 'user');

    // Process message with chatbot
    const response = await this.chatbotService.processMessage(message, userId);

    // Save bot response
    await this.saveMessage(finalSessionId, userId, response.message, 'bot', {
      responseType: response.type,
      faqId: response.faqId,
      confidence: response.confidence,
    });

    // Handle escalation if needed
    if (response.type === 'escalation') {
      await this.escalateConversation(finalSessionId, userId);
    }

    return {
      response: response.message,
      type: response.type,
      sessionId: finalSessionId,
      faqId: response.faqId,
    };
  }

  @Get('conversations')
  async getConversations(
    @Query('sessionId') sessionId?: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub;

    if (userId) {
      return this.conversationRepository.findByUserId(userId);
    } else if (sessionId) {
      return this.conversationRepository.findBySessionId(sessionId);
    }

    return [];
  }

  @Post('escalate')
  async escalateConversation(
    @Body() body: { sessionId?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const sessionId = body.sessionId;
    const userId = req.user?.sub;

    if (!sessionId && !userId) {
      return { success: false, message: 'Session ID or user authentication required' };
    }

    await this.escalateConversation(sessionId || '', userId);

    // Create a system message about escalation
    await this.saveMessage(sessionId || '', userId, 'Conversation escalated to human support', 'system', {
      escalation: true,
    });

    return {
      success: true,
      message: 'Conversation escalated to human support. An agent will contact you soon.'
    };
  }

  @Get('welcome')
  async getWelcomeMessage() {
    return {
      message: this.chatbotService.getWelcomeMessage(),
      type: 'welcome',
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveMessage(
    sessionId: string,
    userId: string | undefined,
    message: string,
    type: 'user' | 'bot' | 'system',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const conversation = new ChatConversation({
      id: uuidv4(),
      sessionId: userId ? undefined : sessionId, // Only use sessionId for anonymous users
      userId,
      message,
      type,
      metadata,
      status: 'active',
    });

    await this.conversationRepository.create(conversation);
  }

  private async escalateConversation(sessionId: string, userId?: string): Promise<void> {
    // Find recent conversations for this session/user and mark as escalated
    const conversations = userId
      ? await this.conversationRepository.findByUserId(userId)
      : await this.conversationRepository.findBySessionId(sessionId);

    // Update the most recent conversation status
    if (conversations.length > 0) {
      const latestConversation = conversations[conversations.length - 1];
      await this.conversationRepository.updateStatus(latestConversation.id, 'escalated');
    }
  }
}