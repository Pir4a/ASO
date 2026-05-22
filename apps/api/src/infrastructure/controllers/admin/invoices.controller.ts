import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ListInvoicesUseCase } from '../../../application/use-cases/invoices/list-invoices.use-case';
import { GetInvoiceUseCase } from '../../../application/use-cases/invoices/get-invoice.use-case';
import { GetInvoicePdfUseCase } from '../../../application/use-cases/invoices/get-invoice-pdf.use-case';
import { ResendInvoiceEmailUseCase } from '../../../application/use-cases/invoices/resend-invoice-email.use-case';
import { UpdateInvoiceUseCase } from '../../../application/use-cases/invoices/update-invoice.use-case';
import { CancelInvoiceUseCase } from '../../../application/use-cases/credit-notes/cancel-invoice.use-case';
import { ListInvoicesQueryDto } from '../../dto/invoices/list-invoices-query.dto';
import { PatchInvoiceDto, ResendInvoiceEmailDto } from '../../dto/invoices/patch-invoice.dto';
import { CancelInvoiceDto } from '../../dto/credit-notes/send-credit-note-email.dto';

@ApiTags('Invoices (admin)')
@ApiBearerAuth('jwt')
@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminInvoicesController {
    constructor(
        private readonly listInvoices: ListInvoicesUseCase,
        private readonly getInvoice: GetInvoiceUseCase,
        private readonly getInvoicePdf: GetInvoicePdfUseCase,
        private readonly resendInvoiceEmail: ResendInvoiceEmailUseCase,
        private readonly updateInvoice: UpdateInvoiceUseCase,
        private readonly cancelInvoice: CancelInvoiceUseCase,
    ) { }

    @Get()
    async list(@Query() query: ListInvoicesQueryDto) {
        const result = await this.listInvoices.execute({
            page: query.page,
            pageSize: query.pageSize,
            filters: {
                status: query.status,
                userId: query.userId,
                orderId: query.orderId,
                fromDate: query.from ? new Date(query.from) : undefined,
                toDate: query.to ? new Date(query.to) : undefined,
            },
        });
        return {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            invoices: result.rows.map(({ invoice, customerEmail }) => ({
                id: invoice.id,
                number: invoice.number,
                orderId: invoice.orderId,
                userId: invoice.userId,
                customerEmail,
                totalHtCents: invoice.totalHtCents,
                totalTvaCents: invoice.totalTvaCents,
                totalTtcCents: invoice.totalTtcCents,
                currency: invoice.currency,
                status: invoice.status,
                issuedAt: invoice.issuedAt,
                pdfUrl: invoice.pdfUrl,
            })),
        };
    }

    @Get(':id')
    async detail(@Param('id') id: string) {
        const invoice = await this.getInvoice.execute(id);
        return invoice;
    }

    @Get(':id/pdf')
    async pdf(@Param('id') id: string, @Res() res: Response) {
        const payload = await this.getInvoicePdf.execute(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${payload.filename}"`,
            'Content-Length': payload.buffer.length.toString(),
        });
        res.send(payload.buffer);
    }

    @Post(':id/email')
    @HttpCode(HttpStatus.OK)
    async email(@Param('id') id: string, @Body() body: ResendInvoiceEmailDto) {
        return this.resendInvoiceEmail.execute(id, body.overrideEmail);
    }

    @Patch(':id')
    async patch(@Param('id') id: string, @Body() body: PatchInvoiceDto) {
        return this.updateInvoice.execute(id, body);
    }

    /**
     * Soft-cancel an invoice and emit the mirror credit note (AVO-…). The
     * underlying order is also cancelled best-effort. Returns the credit note.
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async delete(@Param('id') id: string, @Body() body: CancelInvoiceDto) {
        const creditNote = await this.cancelInvoice.execute({
            invoiceId: id,
            reason: body?.reason,
        });
        return { ok: true, creditNote };
    }
}
