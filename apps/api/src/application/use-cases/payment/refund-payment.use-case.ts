import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../../domain/gateways/payment.gateway';
import type { PaymentGateway } from '../../../domain/gateways/payment.gateway';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';

@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository
  ) { }

  async execute(orderId: string): Promise<{ refundId: string; status: string }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!order.paymentId) {
      throw new BadRequestException('Order has no payment to refund');
    }

    const refund = await this.paymentGateway.refundPayment(order.paymentId);

    await this.orderRepository.updateStatus(order.id, order.status, {
      paymentStatus: 'refunded',
      refundId: refund.id,
      refundedAt: new Date(),
    });

    return { refundId: refund.id, status: refund.status };
  }
}
