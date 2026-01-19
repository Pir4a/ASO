import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class GetPaymentMethodsUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(userId: string): Promise<any[]> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.stripeCustomerId) {
            return [];
        }

        return this.paymentGateway.listPaymentMethods(user.stripeCustomerId);
    }
}
