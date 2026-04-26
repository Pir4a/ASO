import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceOrm } from '../persistence/typeorm/entities/invoice.entity';
import { User } from '../persistence/typeorm/entities/user.entity';
import { Order } from '../persistence/typeorm/entities/order.entity';
import { OrderItem } from '../persistence/typeorm/entities/order-item.entity';
import { TypeOrmInvoiceRepository } from '../persistence/typeorm/repositories/invoice.repository';
import { TypeOrmOrderRepository } from '../persistence/typeorm/repositories/order.repository';
import { INVOICE_REPOSITORY_TOKEN } from '../../domain/repositories/invoice.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository.interface';
import { GenerateInvoiceOnPaymentUseCase } from '../../application/use-cases/invoices/generate-invoice-on-payment.use-case';
import { ListInvoicesUseCase } from '../../application/use-cases/invoices/list-invoices.use-case';
import { GetInvoiceUseCase } from '../../application/use-cases/invoices/get-invoice.use-case';
import { GetInvoicePdfUseCase } from '../../application/use-cases/invoices/get-invoice-pdf.use-case';
import { ResendInvoiceEmailUseCase } from '../../application/use-cases/invoices/resend-invoice-email.use-case';
import { UpdateInvoiceUseCase } from '../../application/use-cases/invoices/update-invoice.use-case';
import { AdminInvoicesController } from '../controllers/admin/invoices.controller';
import { PdfService } from '../services/pdf.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';
import { CreditNotesModule } from './credit-notes.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([InvoiceOrm, User, Order, OrderItem]),
        UsersModule,
        AuthModule,
        CreditNotesModule,
    ],
    controllers: [AdminInvoicesController],
    providers: [
        {
            provide: INVOICE_REPOSITORY_TOKEN,
            useClass: TypeOrmInvoiceRepository,
        },
        {
            provide: ORDER_REPOSITORY_TOKEN,
            useClass: TypeOrmOrderRepository,
        },
        GenerateInvoiceOnPaymentUseCase,
        ListInvoicesUseCase,
        GetInvoiceUseCase,
        GetInvoicePdfUseCase,
        ResendInvoiceEmailUseCase,
        UpdateInvoiceUseCase,
        PdfService,
        JwtAuthGuard,
        RolesGuard,
    ],
    exports: [
        INVOICE_REPOSITORY_TOKEN,
        GenerateInvoiceOnPaymentUseCase,
        PdfService,
    ],
})
export class InvoicesModule { }
