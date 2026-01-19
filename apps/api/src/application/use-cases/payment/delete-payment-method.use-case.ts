import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';

@Injectable()
export class DeletePaymentMethodUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
    ) { }

    async execute(paymentMethodId: string): Promise<void> {
        return this.paymentGateway.detachPaymentMethod(paymentMethodId);
    }
}
