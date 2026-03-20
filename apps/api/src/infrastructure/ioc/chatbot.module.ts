import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatConversation } from '../persistence/typeorm/entities/chat-conversation.entity';
import { TypeOrmChatConversationRepository } from '../persistence/typeorm/repositories/chat-conversation.repository';
import { CHAT_CONVERSATION_REPOSITORY_TOKEN } from '../../domain/repositories/chat-conversation.repository.interface';
import { ChatbotService } from '../services/chatbot/chatbot.service';
import { FAQModule } from './faq.module';
import { ChatbotController } from '../controllers/chatbot.controller';
import { AdminChatbotController } from '../controllers/admin/chatbot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatConversation]), FAQModule],
  controllers: [ChatbotController, AdminChatbotController],
  providers: [
    {
      provide: CHAT_CONVERSATION_REPOSITORY_TOKEN,
      useClass: TypeOrmChatConversationRepository,
    },
    ChatbotService,
  ],
  exports: [ChatbotService, CHAT_CONVERSATION_REPOSITORY_TOKEN],
})
export class ChatbotModule { }