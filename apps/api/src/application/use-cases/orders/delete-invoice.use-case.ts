import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { CREDIT_NOTE_REPOSITORY_TOKEN } from '../../../domain/repositories/credit-note.repository.interface';
import type { CreditNoteRepository } from '../../../domain/repositories/credit-note.repository.interface';
import { CreditNote } from '../../../domain/entities/credit-note.entity';

@Injectable()
export class DeleteInvoiceUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(CREDIT_NOTE_REPOSITORY_TOKEN)
    private readonly creditNoteRepository: CreditNoteRepository
  ) { }

  async execute(orderId: string, userId: string, reason?: string) {
    const order = await this.orderRepository.findOneByIdAndUserId(orderId, userId);
    if (!order) {
      const existingOrder = await this.orderRepository.findById(orderId);
      if (existingOrder) {
        throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
      }
      throw new NotFoundException('Commande introuvable.');
    }

    const invoice = await this.invoiceRepository.findByOrderId(orderId);
    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }

    invoice.status = 'voided';
    invoice.history = [
      ...(invoice.history || []),
      {
        updatedAt: new Date().toISOString(),
        changes: { status: 'voided', reason },
      },
    ];
    await this.invoiceRepository.update(invoice);

    const creditNote = await this.creditNoteRepository.create(new CreditNote({
      orderId: order.id,
      invoiceId: invoice.id,
      creditNoteNumber: this.generateCreditNoteNumber(order.id),
      reason: reason || 'Annulation facture',
    }));

    return creditNote;
  }

  private generateCreditNoteNumber(orderId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const short = orderId.replace(/-/g, '').slice(0, 6).toUpperCase();
    const sequence = Date.now().toString().slice(-5);
    return `AV-${year}-${short}-${sequence}`;
  }
}
