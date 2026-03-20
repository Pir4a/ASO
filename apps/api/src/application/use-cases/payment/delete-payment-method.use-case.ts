import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { PAYMENT_METHOD_REPOSITORY_TOKEN } from '../../../domain/repositories/payment-method.repository.interface';
import type { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';

@Injectable()
export class DeletePaymentMethodUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(PAYMENT_METHOD_REPOSITORY_TOKEN)
        private readonly paymentMethodRepository: PaymentMethodRepository,
    ) { }

    async execute(paymentMethodId: string): Promise<void> {
        await this.paymentGateway.detachPaymentMethod(paymentMethodId);
        await this.paymentMethodRepository.deleteByProviderPaymentMethodId(paymentMethodId);
    }
}
