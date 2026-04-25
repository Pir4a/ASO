import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';

@Injectable()
export class CreatePaymentIntentUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    orderId: string,
    userId?: string,
  ): Promise<{ clientSecret: string }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Attach the user's Stripe customer so saved cards show in PaymentElement.
    let customerId: string | undefined;
    if (userId) {
      const user = await this.userRepository.findById(userId);
      if (user) {
        if (!user.stripeCustomerId) {
          user.stripeCustomerId = await this.paymentGateway.createCustomer(
            user.email,
            user.firstName
              ? `${user.firstName} ${user.lastName ?? ''}`.trim()
              : user.email,
          );
          await this.userRepository.update(user);
        }
        customerId = user.stripeCustomerId;
      }
    }

    const { clientSecret, id } = await this.paymentGateway.createPaymentIntent(
      order.total,
      order.currency,
      {
        metadata: { orderId: order.id },
        customerId,
        setupFutureUsage: !!customerId,
      },
    );

    await this.orderRepository.updateStatus(order.id, 'pending', {
      paymentId: id,
      paymentStatus: 'pending',
    });

    return { clientSecret };
  }
}
