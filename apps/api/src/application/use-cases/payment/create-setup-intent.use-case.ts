import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class CreateSetupIntentUseCase {
    constructor(
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: PaymentGateway,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(userId: string): Promise<{ clientSecret: string }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        let stripeCustomerId = user.stripeCustomerId;

        if (!stripeCustomerId) {
            stripeCustomerId = await this.paymentGateway.createCustomer(user.email, user.firstName ? `${user.firstName} ${user.lastName}` : user.email);
            user.stripeCustomerId = stripeCustomerId;
            await this.userRepository.update(user);
        }

        return this.paymentGateway.createSetupIntent(stripeCustomerId, { userId });
    }
}
