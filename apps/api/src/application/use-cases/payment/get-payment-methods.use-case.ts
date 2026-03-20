import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { PAYMENT_METHOD_REPOSITORY_TOKEN } from '../../../domain/repositories/payment-method.repository.interface';
import type { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';

@Injectable()
export class GetPaymentMethodsUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(PAYMENT_METHOD_REPOSITORY_TOKEN)
        private readonly paymentMethodRepository: PaymentMethodRepository,
    ) { }

    async execute(userId: string): Promise<any[]> {
        const storedMethods = await this.paymentMethodRepository.findByUserId(userId);
        if (storedMethods.length > 0) {
            return storedMethods.map(pm => ({
                id: pm.providerPaymentMethodId,
                brand: pm.brand,
                last4: pm.last4,
                expMonth: pm.expMonth,
                expYear: pm.expYear,
            }));
        }

        const user = await this.userRepository.findById(userId);
        if (!user || !user.stripeCustomerId) {
            return [];
        }

        return this.paymentGateway.listPaymentMethods(user.stripeCustomerId);
    }
}
