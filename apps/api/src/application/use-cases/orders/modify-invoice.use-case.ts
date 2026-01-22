import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { INVOICE_REPOSITORY_TOKEN } from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';
import { InvoiceStorageService } from '../../../infrastructure/services/invoice-storage.service';

export interface InvoiceUpdatePayload {
  issuedAt?: string;
  seller?: Record<string, any>;
  buyer?: Record<string, any>;
  notes?: string;
}

@Injectable()
export class ModifyInvoiceUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: InvoiceRepository,
    private readonly pdfService: PdfService,
    private readonly invoiceStorage: InvoiceStorageService
  ) { }

  async execute(orderId: string, userId: string, payload: InvoiceUpdatePayload) {
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

    const previousSnapshot = invoice.dataSnapshot || {};
    const nextSnapshot = this.mergeSnapshot(previousSnapshot, payload);

    invoice.dataSnapshot = nextSnapshot;
    if (payload.issuedAt) {
      invoice.issuedAt = new Date(payload.issuedAt);
    }
    invoice.history = [
      ...(invoice.history || []),
      { updatedAt: new Date().toISOString(), changes: payload },
    ];

    const pdfBuffer = await this.pdfService.generateInvoice(order, {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      seller: nextSnapshot.seller,
      buyer: nextSnapshot.buyer,
      notes: nextSnapshot.notes,
    });

    const pdfPath = await this.invoiceStorage.saveInvoicePdf(invoice.invoiceNumber, pdfBuffer);
    invoice.pdfPath = pdfPath;

    return this.invoiceRepository.update(invoice);
  }

  private mergeSnapshot(snapshot: Record<string, any>, payload: InvoiceUpdatePayload): Record<string, any> {
    return {
      ...snapshot,
      seller: { ...(snapshot.seller || {}), ...(payload.seller || {}) },
      buyer: { ...(snapshot.buyer || {}), ...(payload.buyer || {}) },
      notes: payload.notes ?? snapshot.notes,
    };
  }
}
