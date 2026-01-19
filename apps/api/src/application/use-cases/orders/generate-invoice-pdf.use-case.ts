import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { PdfService } from '../../../infrastructure/services/pdf.service';

@Injectable()
export class GenerateInvoicePdfUseCase {
    constructor(
        @Inject(ORDER_REPOSITORY_TOKEN)
        private readonly orderRepository: OrderRepository,
        private readonly pdfService: PdfService,
    ) { }

    async execute(orderId: string, userId: string): Promise<Buffer> {
        const order = await this.orderRepository.findOneByIdAndUserId(orderId, userId);

        if (!order) {
            const existingOrder = await this.orderRepository.findById(orderId);
            if (existingOrder) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette commande.');
            }
            throw new NotFoundException('Commande introuvable.');
        }

        return this.pdfService.generateInvoice(order);
    }
}
