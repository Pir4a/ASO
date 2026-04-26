import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ListCreditNotesUseCase } from '../../../application/use-cases/credit-notes/list-credit-notes.use-case';
import { GetCreditNoteUseCase } from '../../../application/use-cases/credit-notes/get-credit-note.use-case';
import { GetCreditNotePdfUseCase } from '../../../application/use-cases/credit-notes/get-credit-note-pdf.use-case';
import { SendCreditNoteEmailUseCase } from '../../../application/use-cases/credit-notes/send-credit-note-email.use-case';
import { ListCreditNotesQueryDto } from '../../dto/credit-notes/list-credit-notes-query.dto';
import { SendCreditNoteEmailDto } from '../../dto/credit-notes/send-credit-note-email.dto';

@Controller('admin/credit-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCreditNotesController {
    constructor(
        private readonly listCreditNotes: ListCreditNotesUseCase,
        private readonly getCreditNote: GetCreditNoteUseCase,
        private readonly getCreditNotePdf: GetCreditNotePdfUseCase,
        private readonly sendCreditNoteEmail: SendCreditNoteEmailUseCase,
    ) { }

    @Get()
    async list(@Query() query: ListCreditNotesQueryDto) {
        const result = await this.listCreditNotes.execute({
            page: query.page,
            pageSize: query.pageSize,
            filters: {
                invoiceId: query.invoiceId,
                reason: query.reason,
                search: query.search,
            },
        });
        return {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            creditNotes: result.items.map((cn) => ({
                id: cn.id,
                number: cn.number,
                invoiceId: cn.invoiceId,
                userId: cn.userId,
                amountTtcCents: cn.amountTtcCents,
                currency: cn.currency,
                reason: cn.reason,
                issuedAt: cn.issuedAt,
                pdfUrl: cn.pdfUrl,
            })),
        };
    }

    @Get(':id')
    async detail(@Param('id') id: string) {
        return this.getCreditNote.execute(id);
    }

    @Get(':id/pdf')
    async pdf(@Param('id') id: string, @Res() res: Response) {
        const payload = await this.getCreditNotePdf.execute(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${payload.filename}"`,
            'Content-Length': payload.buffer.length.toString(),
        });
        res.send(payload.buffer);
    }

    @Post(':id/email')
    @HttpCode(HttpStatus.OK)
    async email(@Param('id') id: string, @Body() body: SendCreditNoteEmailDto) {
        return this.sendCreditNoteEmail.execute(id, body.overrideEmail);
    }
}
