import { Module } from '@nestjs/common';
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

@Module({
    imports: [CartModule, OrdersModule, UsersModule],
    controllers: [PaymentController],
    providers: [
        {
            provide: PAYMENT_GATEWAY,
            useClass: StripePaymentService,
        },
        CreatePaymentIntentUseCase,
        CreateSetupIntentUseCase,
        GetPaymentMethodsUseCase,
        DeletePaymentMethodUseCase,
    ],
    exports: [PAYMENT_GATEWAY],
})
export class PaymentModule { }
