import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditNoteOrm } from '../persistence/typeorm/entities/credit-note.entity';
import { InvoiceOrm } from '../persistence/typeorm/entities/invoice.entity';
import { Order } from '../persistence/typeorm/entities/order.entity';
import { OrderItem } from '../persistence/typeorm/entities/order-item.entity';
import { User } from '../persistence/typeorm/entities/user.entity';
import { CreditNoteOrmRepository } from '../persistence/typeorm/repositories/credit-note.repository';
import { TypeOrmInvoiceRepository } from '../persistence/typeorm/repositories/invoice.repository';
import { TypeOrmOrderRepository } from '../persistence/typeorm/repositories/order.repository';
import { CREDIT_NOTE_REPOSITORY_TOKEN } from '../../domain/repositories/credit-note.repository.interface';
import { INVOICE_REPOSITORY_TOKEN } from '../../domain/repositories/invoice.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository.interface';
import { CancelInvoiceUseCase } from '../../application/use-cases/credit-notes/cancel-invoice.use-case';
import { ListCreditNotesUseCase } from '../../application/use-cases/credit-notes/list-credit-notes.use-case';
import { GetCreditNoteUseCase } from '../../application/use-cases/credit-notes/get-credit-note.use-case';
import { GetCreditNotePdfUseCase } from '../../application/use-cases/credit-notes/get-credit-note-pdf.use-case';
import { SendCreditNoteEmailUseCase } from '../../application/use-cases/credit-notes/send-credit-note-email.use-case';
import { AdminCreditNotesController } from '../controllers/admin/credit-notes.controller';
import { PdfService } from '../services/pdf.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CreditNoteOrm, InvoiceOrm, Order, OrderItem, User]),
        UsersModule,
        AuthModule,
    ],
    controllers: [AdminCreditNotesController],
    providers: [
        {
            provide: CREDIT_NOTE_REPOSITORY_TOKEN,
            useClass: CreditNoteOrmRepository,
        },
        {
            provide: INVOICE_REPOSITORY_TOKEN,
            useClass: TypeOrmInvoiceRepository,
        },
        {
            provide: ORDER_REPOSITORY_TOKEN,
            useClass: TypeOrmOrderRepository,
        },
        CancelInvoiceUseCase,
        ListCreditNotesUseCase,
        GetCreditNoteUseCase,
        GetCreditNotePdfUseCase,
        SendCreditNoteEmailUseCase,
        PdfService,
        JwtAuthGuard,
        RolesGuard,
    ],
    exports: [CancelInvoiceUseCase, CREDIT_NOTE_REPOSITORY_TOKEN],
})
export class CreditNotesModule { }
