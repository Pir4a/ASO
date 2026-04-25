import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class SetDefaultPaymentMethodUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, paymentMethodId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new NotFoundException('Aucun compte de paiement enregistré.');
    }
    await this.paymentGateway.setDefaultPaymentMethod(
      user.stripeCustomerId,
      paymentMethodId,
    );
  }
}
