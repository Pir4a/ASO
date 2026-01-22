import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { PaymentIntentRepository } from '../../../domain/repositories/payment-intent.repository.interface';
import { PAYMENT_INTENT_REPOSITORY_TOKEN } from '../../../domain/repositories/payment-intent.repository.interface';
import type { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';
import { PAYMENT_METHOD_REPOSITORY_TOKEN } from '../../../domain/repositories/payment-method.repository.interface';
import { PaymentMethod } from '../../../domain/entities/payment-method.entity';

@Injectable()
export class HandleStripeWebhookUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(PAYMENT_INTENT_REPOSITORY_TOKEN)
    private readonly paymentIntentRepository: PaymentIntentRepository,
    @Inject(PAYMENT_METHOD_REPOSITORY_TOKEN)
    private readonly paymentMethodRepository: PaymentMethodRepository
  ) { }

  async execute(signature: string | undefined, payload: Buffer | string): Promise<{ received: true }> {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.paymentGateway.constructWebhookEvent(payload, signature);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await this.updatePaymentIntentStatus(paymentIntent.id, paymentIntent.status);
        await this.updateOrderFromPaymentIntent(paymentIntent, 'paid', {
          paidAt: new Date(paymentIntent.created * 1000),
        }, 'processing');
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await this.updatePaymentIntentStatus(paymentIntent.id, 'payment_failed');
        await this.updateOrderFromPaymentIntent(paymentIntent, 'failed');
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (paymentIntentId) {
          await this.updatePaymentIntentStatus(paymentIntentId, 'refunded');
          await this.updateOrderFromPaymentIntent(
            { id: paymentIntentId, metadata: charge.metadata },
            'refunded',
            {
              refundId: charge.refunds?.data?.[0]?.id,
              refundedAt: new Date(charge.created * 1000),
            },
            'cancelled'
          );
        }
        break;
      }
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object;
        const paymentMethodId = setupIntent.payment_method;
        const userId = setupIntent.metadata?.userId;
        if (paymentMethodId && userId) {
          await this.persistPaymentMethod(userId, paymentMethodId);
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  private async updatePaymentIntentStatus(stripePaymentIntentId: string, status: string) {
    const paymentIntent = await this.paymentIntentRepository.findByStripePaymentIntentId(stripePaymentIntentId);
    if (!paymentIntent) return;
    paymentIntent.status = status as any;
    await this.paymentIntentRepository.update(paymentIntent);
  }

  private async updateOrderFromPaymentIntent(
    paymentIntent: { id: string; metadata?: Record<string, string> },
    paymentStatus: string,
    extraMetadata: Record<string, any> = {},
    orderStatus?: string
  ) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) return;

    const order = await this.orderRepository.findById(orderId);
    if (!order) return;

    await this.orderRepository.updateStatus(order.id, orderStatus || order.status, {
      paymentId: paymentIntent.id,
      paymentStatus,
      paymentMethod: 'stripe',
      ...extraMetadata,
    });
  }

  private async persistPaymentMethod(userId: string, paymentMethodId: string) {
    const existing = await this.paymentMethodRepository.findByProviderPaymentMethodId(paymentMethodId);
    if (existing) return;

    const details = await this.paymentGateway.getPaymentMethodDetails(paymentMethodId);
    await this.paymentMethodRepository.create(new PaymentMethod({
      userId,
      provider: 'stripe',
      providerPaymentMethodId: paymentMethodId,
      brand: details.brand,
      last4: details.last4,
      expMonth: details.expMonth,
      expYear: details.expYear,
    }));
  }
}
