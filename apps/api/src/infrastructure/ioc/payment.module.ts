import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../domain/gateways/payment.gateway';
import { StripePaymentService } from '../services/payment/stripe.service';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/payment/create-payment-intent.use-case';
import { PaymentController } from '../controllers/payment.controller';
import { CartModule } from './cart.module';
import { OrdersModule } from './orders.module';

@Module({
    imports: [CartModule, OrdersModule],
    controllers: [PaymentController],
    providers: [
        {
            provide: PAYMENT_GATEWAY,
            useClass: StripePaymentService,
        },
        CreatePaymentIntentUseCase,
    ],
    exports: [PAYMENT_GATEWAY],
})
export class PaymentModule { }
