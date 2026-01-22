import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PAYMENT_GATEWAY } from '../../domain/gateways/payment.gateway';
import { StripePaymentService } from '../services/payment/stripe.service';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/payment/create-payment-intent.use-case';
import { CreateSetupIntentUseCase } from '../../application/use-cases/payment/create-setup-intent.use-case';
import { GetPaymentMethodsUseCase } from '../../application/use-cases/payment/get-payment-methods.use-case';
import { DeletePaymentMethodUseCase } from '../../application/use-cases/payment/delete-payment-method.use-case';
import { PaymentController } from '../controllers/payment.controller';
import { CartModule } from './cart.module';
import { OrdersModule } from './orders.module';
import { UsersModule } from './users.module';
import { PaymentIntent } from '../persistence/typeorm/entities/payment-intent.entity';
import { PaymentMethod } from '../persistence/typeorm/entities/payment-method.entity';
import { TypeOrmPaymentIntentRepository } from '../persistence/typeorm/repositories/payment-intent.repository';
import { PAYMENT_INTENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment-intent.repository.interface';
import { PAYMENT_METHOD_REPOSITORY_TOKEN } from '../../domain/repositories/payment-method.repository.interface';
import { TypeOrmPaymentMethodRepository } from '../persistence/typeorm/repositories/payment-method.repository';
import { HandleStripeWebhookUseCase } from '../../application/use-cases/payment/handle-stripe-webhook.use-case';
import { RefundPaymentUseCase } from '../../application/use-cases/payment/refund-payment.use-case';

@Module({
    imports: [TypeOrmModule.forFeature([PaymentIntent, PaymentMethod]), CartModule, OrdersModule, UsersModule],
    controllers: [PaymentController],
    providers: [
        {
            provide: PAYMENT_GATEWAY,
            useClass: StripePaymentService,
        },
        {
            provide: PAYMENT_INTENT_REPOSITORY_TOKEN,
            useClass: TypeOrmPaymentIntentRepository,
        },
        {
            provide: PAYMENT_METHOD_REPOSITORY_TOKEN,
            useClass: TypeOrmPaymentMethodRepository,
        },
        CreatePaymentIntentUseCase,
        CreateSetupIntentUseCase,
        GetPaymentMethodsUseCase,
        DeletePaymentMethodUseCase,
        HandleStripeWebhookUseCase,
        RefundPaymentUseCase,
    ],
    exports: [PAYMENT_GATEWAY],
})
export class PaymentModule { }
