import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionOrm } from '../persistence/typeorm/entities/chat-session.entity';
import { ChatMessageOrm } from '../persistence/typeorm/entities/chat-message.entity';
import { TypeOrmChatSessionRepository } from '../persistence/typeorm/repositories/chat-session.repository';
import { TypeOrmChatMessageRepository } from '../persistence/typeorm/repositories/chat-message.repository';
import { CHAT_SESSION_REPOSITORY_TOKEN } from '../../domain/repositories/chat-session.repository.interface';
import { CHAT_MESSAGE_REPOSITORY_TOKEN } from '../../domain/repositories/chat-message.repository.interface';
import { ChatController } from '../controllers/chat/chat.controller';
import { AdminChatController } from '../controllers/admin/chat.controller';
import { ChatService } from '../services/chat.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatSessionOrm, ChatMessageOrm]),
        UsersModule,
        AuthModule,
    ],
    controllers: [ChatController, AdminChatController],
    providers: [
        {
            provide: CHAT_SESSION_REPOSITORY_TOKEN,
            useClass: TypeOrmChatSessionRepository,
        },
        {
            provide: CHAT_MESSAGE_REPOSITORY_TOKEN,
            useClass: TypeOrmChatMessageRepository,
        },
        ChatService,
        JwtAuthGuard,
        RolesGuard,
    ],
})
export class ChatModule { }
