import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHAT_SESSION_REPOSITORY_TOKEN,
  type ChatSessionRepository,
} from '../../domain/repositories/chat-session.repository.interface';
import {
  CHAT_MESSAGE_REPOSITORY_TOKEN,
  type ChatMessageRepository,
} from '../../domain/repositories/chat-message.repository.interface';
import { ChatSession } from '../../domain/entities/chat-session.entity';
import { ChatMessage } from '../../domain/entities/chat-message.entity';

const SYSTEM_PROMPT = `You are the AI assistant for **Althea Systems**, an e-commerce platform specializing in high-quality medical equipment.

Answer customer questions helpfully and concisely. Use the knowledge base below.

## Knowledge Base

### About Althea Systems
- E-commerce platform for professional medical equipment (devices, instruments, protective gear, lab supplies).
- Serves healthcare professionals, clinics, hospitals, and labs across Europe.
- Based in France; prices are in EUR, VAT included.

### Product Categories
- Diagnostic Devices (stethoscopes, blood-pressure monitors, oximeters)
- Surgical Instruments (scalpels, forceps, retractors)
- Protective Equipment (gloves, masks, gowns, face shields)
- Lab Supplies (pipettes, centrifuge tubes, reagents)
- Mobility & Rehabilitation (wheelchairs, walkers, braces)

### Ordering & Cart
- Add items to cart without an account (guest cart).
- Cart persists across sessions.
- Promo codes can be applied at checkout for discounts.

### Checkout & Payment
- Secure checkout via Stripe (credit/debit cards accepted).
- Delivery address required; multiple addresses can be saved.
- Order confirmation sent by email.

### Shipping & Returns
- Standard delivery: 3-5 business days within France.
- Express delivery: 1-2 business days (surcharge applies).
- Free shipping on orders above 150 EUR.
- 30-day return policy for unopened items in original packaging.
- Contact support to initiate a return.

### Account
- Create an account to track orders, save addresses, and view order history.
- Login via email/password. Password reset available via email link.

### Support
- Live chatbot (you!) for instant help.
- Contact form available at /contact for complex issues.
- Email support: support@althea-systems.com
- Response time: within 24 hours on business days.

## Rules
- Be friendly and professional.
- If you don't know something, say so honestly and suggest contacting human support.
- Keep answers concise (2-4 sentences when possible).
- Do NOT make up product names, prices, or policies not listed above.
- Respond in the same language the customer uses.`;

const MAX_HISTORY = 6;

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);
    private readonly ollamaUrl: string;
    private readonly model: string;

    constructor(
        private readonly config: ConfigService,
        @Inject(CHAT_SESSION_REPOSITORY_TOKEN)
        private readonly sessionRepository: ChatSessionRepository,
        @Inject(CHAT_MESSAGE_REPOSITORY_TOKEN)
        private readonly messageRepository: ChatMessageRepository,
    ) {
        this.ollamaUrl = this.config.get<string>('OLLAMA_URL', 'http://localhost:11434');
        this.model = this.config.get<string>('OLLAMA_MODEL', 'llama3.2:3b');
    }

    async startSession(input: {
        email: string;
        subject: string;
        userId?: string | null;
    }): Promise<ChatSession> {
        const now = new Date();
        return this.sessionRepository.create(
            new ChatSession({
                userId: input.userId ?? null,
                guestEmail: input.email,
                subject: input.subject,
                status: 'open',
                escalatedAt: null,
                lastActivityAt: now,
                createdAt: now,
            }),
        );
    }

    async sendMessage(
        sessionId: string,
        content: string,
    ): Promise<{ session: ChatSession; reply: ChatMessage }> {
        const session = await this.requireSession(sessionId);

        await this.messageRepository.create(
            new ChatMessage({ sessionId, role: 'user', content, createdAt: new Date() }),
        );

        // Pull the persisted history (including the message we just stored) and
        // feed everything except the last user turn as context to the model.
        const history = await this.messageRepository.findBySessionId(sessionId);
        const replyText = await this.callOllama(content, history.slice(0, -1));

        const reply = await this.messageRepository.create(
            new ChatMessage({
                sessionId,
                role: 'assistant',
                content: replyText,
                createdAt: new Date(),
            }),
        );

        session.lastActivityAt = new Date();
        const updated = await this.sessionRepository.update(session);
        return { session: updated, reply };
    }

    async escalate(sessionId: string): Promise<ChatSession> {
        const session = await this.requireSession(sessionId);
        if (session.status === 'escalated') return session;
        session.status = 'escalated';
        session.escalatedAt = new Date();
        session.lastActivityAt = new Date();
        return this.sessionRepository.update(session);
    }

    private async requireSession(sessionId: string): Promise<ChatSession> {
        const session = await this.sessionRepository.findById(sessionId);
        if (!session) throw new NotFoundException('Session de chat introuvable.');
        return session;
    }

    private async callOllama(message: string, history: ChatMessage[]): Promise<string> {
        const prompt = this.buildPrompt(message, history);
        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    system: SYSTEM_PROMPT,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Ollama error ${response.status}: ${errorText}`);
                throw new Error('Failed to get response from AI');
            }

            const data = (await response.json()) as { response?: string };
            return data.response?.trim() || 'Sorry, I could not generate a response.';
        } catch (error) {
            this.logger.error('Ollama request failed', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                return 'The AI service is currently unavailable. Please try again later or contact our support team at support@althea-systems.com.';
            }
            throw error;
        }
    }

    private buildPrompt(message: string, history: ChatMessage[]): string {
        if (!history.length) return message;
        const context = history
            .slice(-MAX_HISTORY)
            .map((h) => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.content}`)
            .join('\n');
        return `${context}\nCustomer: ${message}`;
    }
}
