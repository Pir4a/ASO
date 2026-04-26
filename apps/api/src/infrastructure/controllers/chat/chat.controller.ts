import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ChatService } from '../../services/chat.service';
import { ChatMessageDto, StartChatSessionDto } from '../../dto/chat/chat.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /** Capture email + subject up front so admins can respond off-line. */
    @Post('start')
    async start(@Body() body: StartChatSessionDto) {
        const session = await this.chatService.startSession({
            email: body.email,
            subject: body.subject,
        });
        return {
            sessionId: session.id,
            status: session.status,
            subject: session.subject,
        };
    }

    @Post(':sessionId/message')
    async message(
        @Param('sessionId') sessionId: string,
        @Body() body: ChatMessageDto,
    ) {
        const { reply, session } = await this.chatService.sendMessage(sessionId, body.content);
        return {
            reply: reply.content,
            messageId: reply.id,
            createdAt: reply.createdAt,
            sessionStatus: session.status,
        };
    }

    /** Marks the session for human follow-up. The admin replies via email. */
    @Post(':sessionId/escalate')
    @HttpCode(HttpStatus.OK)
    async escalate(@Param('sessionId') sessionId: string) {
        const session = await this.chatService.escalate(sessionId);
        return {
            sessionId: session.id,
            status: session.status,
            escalatedAt: session.escalatedAt,
        };
    }
}
