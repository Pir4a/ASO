import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../persistence/typeorm/entities/order.entity';
import { OrderItem } from '../persistence/typeorm/entities/order-item.entity';
import { Invoice } from '../persistence/typeorm/entities/invoice.entity';
import { CreditNote } from '../persistence/typeorm/entities/credit-note.entity';
import { TypeOrmOrderRepository } from '../persistence/typeorm/repositories/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository.interface';
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';
import { GetOrdersUseCase } from '../../application/use-cases/orders/get-orders.use-case';
import { GetOrderDetailsUseCase } from '../../application/use-cases/orders/get-order-details.use-case';
import { GenerateInvoicePdfUseCase } from '../../application/use-cases/orders/generate-invoice-pdf.use-case';
import { ModifyInvoiceUseCase } from '../../application/use-cases/orders/modify-invoice.use-case';
import { DeleteInvoiceUseCase } from '../../application/use-cases/orders/delete-invoice.use-case';
import { CartModule } from './cart.module';
import { CheckoutController } from '../controllers/checkout.controller';
import { OrdersController } from '../controllers/orders/orders.controller';
import { AddressModule } from './address.module';
import { UsersModule } from './users.module';
import { PdfService } from '../services/pdf.service';
import { InvoiceStorageService } from '../services/invoice-storage.service';
import { INVOICE_REPOSITORY_TOKEN } from '../../domain/repositories/invoice.repository.interface';
import { CREDIT_NOTE_REPOSITORY_TOKEN } from '../../domain/repositories/credit-note.repository.interface';
import { TypeOrmInvoiceRepository } from '../persistence/typeorm/repositories/invoice.repository';
import { TypeOrmCreditNoteRepository } from '../persistence/typeorm/repositories/credit-note.repository';
import { EMAIL_GATEWAY } from '../../domain/gateways/email.gateway';
import { NodemailerService } from '../services/email/nodemailer.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Invoice, CreditNote]),
        CartModule,
        UsersModule,
        AddressModule,
    ],
    controllers: [CheckoutController, OrdersController],
    providers: [
        {
            provide: ORDER_REPOSITORY_TOKEN,
            useClass: TypeOrmOrderRepository,
        },
        {
            provide: INVOICE_REPOSITORY_TOKEN,
            useClass: TypeOrmInvoiceRepository,
        },
        {
            provide: CREDIT_NOTE_REPOSITORY_TOKEN,
            useClass: TypeOrmCreditNoteRepository,
        },
        {
            provide: EMAIL_GATEWAY,
            useClass: NodemailerService,
        },
        CreateOrderUseCase,
        GetOrdersUseCase,
        GetOrderDetailsUseCase,
        GenerateInvoicePdfUseCase,
        ModifyInvoiceUseCase,
        DeleteInvoiceUseCase,
        PdfService,
        InvoiceStorageService,
    ],
    exports: [ORDER_REPOSITORY_TOKEN],
})
export class OrdersModule { }
