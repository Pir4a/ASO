import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountUnreadContactMessagesUseCase } from '../../application/use-cases/contact/count-unread-contact-messages.use-case';
import { CreateContactMessageUseCase } from '../../application/use-cases/contact/create-contact-message.use-case';
import { GetContactMessagesUseCase } from '../../application/use-cases/contact/get-contact-messages.use-case';
import { MarkContactMessageReadUseCase } from '../../application/use-cases/contact/mark-contact-message-read.use-case';
import { ContactController } from '../controllers/contact/contact.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ContactMessage } from '../persistence/typeorm/entities/contact-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage])],
  controllers: [ContactController],
  providers: [
    CreateContactMessageUseCase,
    GetContactMessagesUseCase,
    MarkContactMessageReadUseCase,
    CountUnreadContactMessagesUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class ContactModule {}
