import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from '../persistence/typeorm/entities/contact-message.entity';
import { CONTACT_MESSAGE_REPOSITORY_TOKEN } from '../../domain/repositories/contact-message.repository.interface';
import { TypeOrmContactMessageRepository } from '../persistence/typeorm/repositories/contact-message.repository';
import { CreateContactMessageUseCase } from '../../application/use-cases/contact/create-contact-message.use-case';
import { ContactController } from '../controllers/contact.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage])],
  controllers: [ContactController],
  providers: [
    {
      provide: CONTACT_MESSAGE_REPOSITORY_TOKEN,
      useClass: TypeOrmContactMessageRepository,
    },
    CreateContactMessageUseCase,
  ],
})
export class ContactModule { }
