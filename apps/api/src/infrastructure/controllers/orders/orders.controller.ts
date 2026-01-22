import { Controller, Get, Param, Query, Req, Res, UseGuards, StreamableFile, Put, Delete, Body } from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { GetOrdersUseCase } from '../../../application/use-cases/orders/get-orders.use-case';
import { GetOrderDetailsUseCase } from '../../../application/use-cases/orders/get-order-details.use-case';
import { GenerateInvoicePdfUseCase } from '../../../application/use-cases/orders/generate-invoice-pdf.use-case';
import { ModifyInvoiceUseCase, InvoiceUpdatePayload } from '../../../application/use-cases/orders/modify-invoice.use-case';
import { DeleteInvoiceUseCase } from '../../../application/use-cases/orders/delete-invoice.use-case';

interface AuthenticatedRequest extends Request {
    user: { sub: string; email: string };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(
        private readonly getOrdersUseCase: GetOrdersUseCase,
        private readonly getOrderDetailsUseCase: GetOrderDetailsUseCase,
        private readonly generateInvoicePdfUseCase: GenerateInvoicePdfUseCase,
        private readonly modifyInvoiceUseCase: ModifyInvoiceUseCase,
        private readonly deleteInvoiceUseCase: DeleteInvoiceUseCase,
    ) { }

    /**
     * GET /orders
     * List all orders for the authenticated user, grouped by year.
     * Supports optional filters: year, status, search
     */
    @Get()
    async list(
        @Req() req: AuthenticatedRequest,
        @Query('year') year?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        const userId = req.user.sub;
        const filters = {
            year: year ? parseInt(year, 10) : undefined,
            status,
            search,
        };

        return this.getOrdersUseCase.execute(userId, filters);
    }

    /**
     * GET /orders/:id
     * Get details of a specific order (only if owned by the user).
     */
    @Get(':id')
    async getDetails(
        @Req() req: AuthenticatedRequest,
        @Param('id') orderId: string,
    ) {
        const userId = req.user.sub;
        return this.getOrderDetailsUseCase.execute(orderId, userId);
    }

    /**
     * GET /orders/:id/invoice
     * Download PDF invoice for a specific order.
     */
    @Get(':id/invoice')
    async downloadInvoice(
        @Req() req: AuthenticatedRequest,
        @Res({ passthrough: true }) res: Response,
        @Param('id') orderId: string,
    ): Promise<StreamableFile> {
        const userId = req.user.sub;
        const pdfBuffer = await this.generateInvoicePdfUseCase.execute(orderId, userId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="facture-${orderId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        return new StreamableFile(pdfBuffer);
    }

    /**
     * PUT /orders/:id/invoice
     * Update invoice metadata and regenerate PDF.
     */
    @Put(':id/invoice')
    async updateInvoice(
        @Req() req: AuthenticatedRequest,
        @Param('id') orderId: string,
        @Body() body: InvoiceUpdatePayload,
    ) {
        const userId = req.user.sub;
        return this.modifyInvoiceUseCase.execute(orderId, userId, body);
    }

    /**
     * DELETE /orders/:id/invoice
     * Void an invoice and create a credit note.
     */
    @Delete(':id/invoice')
    async deleteInvoice(
        @Req() req: AuthenticatedRequest,
        @Param('id') orderId: string,
        @Body('reason') reason?: string,
    ) {
        const userId = req.user.sub;
        return this.deleteInvoiceUseCase.execute(orderId, userId, reason);
    }
}
