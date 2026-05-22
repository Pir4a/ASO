import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
    CHAT_SESSION_REPOSITORY_TOKEN,
    type ChatSessionRepository,
} from '../../../domain/repositories/chat-session.repository.interface';
import {
    CHAT_MESSAGE_REPOSITORY_TOKEN,
    type ChatMessageRepository,
} from '../../../domain/repositories/chat-message.repository.interface';
import { EMAIL_GATEWAY } from '../../../domain/gateways/email.gateway';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';
import {
    USER_REPOSITORY_TOKEN,
    type UserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { ChatMessage } from '../../../domain/entities/chat-message.entity';
import type { ChatSessionStatus } from '../../../domain/entities/chat-session.entity';
import { ChatAdminReplyDto } from '../../dto/chat/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth('jwt')
@Controller('admin/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminChatController {
    constructor(
        @Inject(CHAT_SESSION_REPOSITORY_TOKEN)
        private readonly sessionRepository: ChatSessionRepository,
        @Inject(CHAT_MESSAGE_REPOSITORY_TOKEN)
        private readonly messageRepository: ChatMessageRepository,
        @Inject(EMAIL_GATEWAY)
        private readonly emailGateway: EmailGateway,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    @Get('sessions')
    async listSessions(
        @Query('page') pageStr?: string,
        @Query('limit') limitStr?: string,
        @Query('status') status?: string,
        @Query('escalated') escalatedStr?: string,
    ) {
        const page = Math.max(1, Number.parseInt(pageStr ?? '1', 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(limitStr ?? '25', 10) || 25));
        const skip = (page - 1) * limit;

        const filters = {
            skip,
            take: limit,
            status: status?.trim() ? (status.trim() as ChatSessionStatus) : undefined,
            escalated: escalatedStr === 'true' ? true : undefined,
        };
        const { rows, total } = await this.sessionRepository.findAll(filters);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            data: rows.map((s) => ({
                id: s.id,
                userId: s.userId,
                guestEmail: s.guestEmail,
                subject: s.subject,
                status: s.status,
                escalatedAt: s.escalatedAt,
                lastActivityAt: s.lastActivityAt,
                createdAt: s.createdAt,
            })),
            meta: { total, page, pageSize: limit, totalPages },
        };
    }

    @Get('sessions/:id')
    async sessionDetail(@Param('id') id: string) {
        const session = await this.sessionRepository.findById(id);
        if (!session) throw new NotFoundException('Session introuvable.');
        const messages = await this.messageRepository.findBySessionId(id);
        return {
            id: session.id,
            userId: session.userId,
            guestEmail: session.guestEmail,
            subject: session.subject,
            status: session.status,
            escalatedAt: session.escalatedAt,
            lastActivityAt: session.lastActivityAt,
            createdAt: session.createdAt,
            messages: messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
            })),
        };
    }

    @Post('sessions/:id/reply')
    async reply(@Param('id') id: string, @Body() body: ChatAdminReplyDto) {
        const session = await this.sessionRepository.findById(id);
        if (!session) throw new NotFoundException('Session introuvable.');

        const recipient = await this.resolveRecipientEmail(session.userId, session.guestEmail);
        if (!recipient) {
            throw new BadRequestException("Aucun destinataire e-mail trouvé pour cette session.");
        }

        const reply = await this.messageRepository.create(
            new ChatMessage({
                sessionId: id,
                role: 'admin',
                content: body.content,
                createdAt: new Date(),
            }),
        );

        session.lastActivityAt = new Date();
        await this.sessionRepository.update(session);

        await this.emailGateway.sendChatReply(recipient, session.subject, body.content);

        return {
            id: reply.id,
            sessionId: reply.sessionId,
            role: reply.role,
            content: reply.content,
            createdAt: reply.createdAt,
            emailSentTo: recipient,
        };
    }

    private async resolveRecipientEmail(
        userId: string | null | undefined,
        guestEmail: string | null | undefined,
    ): Promise<string | null> {
        if (guestEmail) return guestEmail;
        if (userId) {
            const user = await this.userRepository.findById(userId);
            return user?.email ?? null;
        }
        return null;
    }
}
