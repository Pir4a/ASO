import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join, resolve } from 'path';
import PDFDocument from 'pdfkit';
import { Order } from '../../domain/entities/order.entity';
import { CreditNote } from '../../domain/entities/credit-note.entity';
import { formatOrderNumber } from '../../application/use-cases/orders/get-order-details.use-case';

const INVOICE_STORAGE_DIR = resolve(process.cwd(), 'storage/invoices');
const CREDIT_NOTE_STORAGE_DIR = resolve(process.cwd(), 'storage/credit-notes');

const NAVY = '#003d5c';
const TEAL = '#00a8b5';
const INK = '#1a1d1a';
const INK_MUTED = '#6b6f69';
const LINE = '#e3f1f3';
const PANEL = '#fafaf8';

@Injectable()
export class PdfService {
    generateInvoice(order: Order): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const orderNumber = order.orderNumber ?? formatOrderNumber(order.id, order.createdAt);
            const pageW = doc.page.width;
            const margin = 50;
            const contentW = pageW - margin * 2;

            /* ── Top brand band (navy) ─────────────────────────── */
            doc.save();
            doc.rect(0, 0, pageW, 88).fill(NAVY);
            // Brand mark
            doc.roundedRect(margin, 24, 40, 40, 6).fill(TEAL);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
                .text('A+', margin + 9, 35, { width: 22, align: 'center', lineBreak: false });
            // Brand name
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
                .text('Althea Systems', margin + 52, 30);
            doc.fillColor('#b3eef2').font('Helvetica').fontSize(9.5)
                .text('Matériel médical professionnel · ISO 13485', margin + 52, 52);
            // FACTURE pill on the right
            doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
                .text('FACTURE', pageW - margin - 80, 38, { width: 80, align: 'right', lineBreak: false });
            doc.font('Helvetica').fontSize(9).fillColor('#b3eef2')
                .text(orderNumber, pageW - margin - 200, 56, { width: 200, align: 'right', lineBreak: false });
            doc.restore();

            /* ── Company + invoice meta blocks ──────────────────── */
            const metaTop = 110;
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('ÉMETTEUR', margin, metaTop);
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
                .text('Althea Systems SAS', margin, metaTop + 14);
            doc.fillColor(INK).font('Helvetica').fontSize(9.5)
                .text('12 rue de la Santé', margin, metaTop + 30)
                .text('75013 Paris, France', margin, metaTop + 43)
                .text('contact@althea.fr · +33 1 84 80 12 00', margin, metaTop + 56)
                .fillColor(INK_MUTED).fontSize(8.5)
                .text('SIRET 802 145 678 00012 · TVA FR12 802145678', margin, metaTop + 72);

            // Right column: invoice meta box
            const metaX = margin + contentW * 0.55;
            const metaW = contentW * 0.45;
            doc.roundedRect(metaX, metaTop - 4, metaW, 96, 6).fillColor(PANEL).fill();
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('FACTURE', metaX + 14, metaTop + 4);
            const metaRow = (label: string, value: string, y: number) => {
                doc.fillColor(INK_MUTED).font('Helvetica').fontSize(8.5)
                    .text(label, metaX + 14, y);
                doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5)
                    .text(value, metaX + 14, y + 11, { width: metaW - 28 });
            };
            metaRow('N° de commande', orderNumber, metaTop + 22);
            metaRow(
                'Date',
                new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                }),
                metaTop + 50,
            );

            /* ── Bill-to ────────────────────────────────────────── */
            const billY = metaTop + 110;
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('FACTURÉ À', margin, billY);
            const addr = (order.billingAddress || order.shippingAddress) as unknown as
                | Record<string, string | undefined>
                | undefined;
            if (addr) {
                const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ');
                doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
                    .text(fullName || 'Client', margin, billY + 14);
                doc.fillColor(INK).font('Helvetica').fontSize(9.5);
                let y = billY + 30;
                if (addr.street) { doc.text(String(addr.street), margin, y); y += 13; }
                if (addr.address2) { doc.text(String(addr.address2), margin, y); y += 13; }
                const cityLine = [addr.postalCode, addr.city, addr.region]
                    .filter(Boolean).join(' ');
                if (cityLine) { doc.text(cityLine, margin, y); y += 13; }
                if (addr.country) { doc.text(String(addr.country), margin, y); y += 13; }
                if (addr.phone) {
                    doc.fillColor(INK_MUTED).fontSize(9).text(String(addr.phone), margin, y);
                }
            } else {
                doc.fillColor(INK_MUTED).fontSize(9.5).text('Adresse non renseignée.', margin, billY + 14);
            }

            /* ── Items table ────────────────────────────────────── */
            const tableTop = 290;
            // Column widths: product, qty, unit, line
            const colProd = margin;
            const colQty = pageW - margin - 270;
            const colUnit = pageW - margin - 180;
            const colLine = pageW - margin - 90;
            const colEnd = pageW - margin;

            // Header band
            doc.save();
            doc.rect(margin, tableTop, contentW, 22).fill(NAVY);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
            doc.text('PRODUIT', colProd + 8, tableTop + 7);
            doc.text('QTÉ', colQty, tableTop + 7, { width: 60, align: 'right' });
            doc.text('PRIX UNITAIRE', colUnit, tableTop + 7, { width: 80, align: 'right' });
            doc.text('TOTAL HT', colLine, tableTop + 7, { width: 80, align: 'right' });
            doc.restore();

            // Rows
            let y = tableTop + 28;
            doc.font('Helvetica').fontSize(10).fillColor(INK);
            const rowH = 22;
            (order.items || []).forEach((item, i) => {
                if (i % 2 === 1) {
                    doc.save();
                    doc.rect(margin, y - 4, contentW, rowH).fillColor(PANEL).fill();
                    doc.restore();
                }
                const lineTotal = Number(item.price) * item.quantity;
                doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5)
                    .text(item.productName, colProd + 8, y, { width: colQty - colProd - 20 });
                if (item.productSku) {
                    doc.fillColor(INK_MUTED).font('Helvetica').fontSize(8.5)
                        .text(`Réf. ${item.productSku}`, colProd + 8, y + 11, { width: colQty - colProd - 20 });
                }
                doc.fillColor(INK).font('Helvetica').fontSize(10);
                doc.text(String(item.quantity), colQty, y + 4, { width: 60, align: 'right' });
                doc.text(this.formatPrice(Number(item.price), item.currency), colUnit, y + 4, { width: 80, align: 'right' });
                doc.font('Helvetica-Bold').fillColor(INK).text(
                    this.formatPrice(lineTotal, item.currency),
                    colLine,
                    y + 4,
                    { width: 80, align: 'right' },
                );
                y += rowH;
            });

            // Bottom border under rows
            doc.moveTo(margin, y).lineTo(colEnd, y).strokeColor(LINE).stroke();

            /* ── Totals (right-aligned) ─────────────────────────── */
            y += 16;
            const totalsX = pageW - margin - 230;
            const totalsW = 230;
            const VAT_RATE = 0.2;
            const totalTtc = Number(order.total);
            const totalHt = totalTtc / (1 + VAT_RATE);
            const totalVat = totalTtc - totalHt;

            const totalRow = (label: string, value: string, opts: { bold?: boolean; emphasis?: boolean } = {}) => {
                doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
                doc.fontSize(opts.emphasis ? 12 : 9.5);
                doc.fillColor(opts.emphasis ? INK : INK_MUTED);
                doc.text(label, totalsX, y, { width: 130, align: 'right' });
                doc.fillColor(opts.emphasis ? NAVY : INK)
                    .font('Helvetica-Bold')
                    .text(value, totalsX + 130, y, { width: 100, align: 'right' });
                y += opts.emphasis ? 22 : 16;
            };
            totalRow('Sous-total HT', this.formatPrice(totalHt, order.currency));
            totalRow(`TVA (${(VAT_RATE * 100).toFixed(0)} %)`, this.formatPrice(totalVat, order.currency));

            // Divider before total
            doc.moveTo(totalsX, y - 4).lineTo(totalsX + totalsW, y - 4).strokeColor(LINE).stroke();
            y += 4;
            totalRow('Total TTC', this.formatPrice(totalTtc, order.currency), {
                bold: true,
                emphasis: true,
            });

            /* ── Payment block ──────────────────────────────────── */
            y += 6;
            doc.save();
            doc.roundedRect(margin, y, contentW, 56, 6).fillColor(PANEL).fill();
            doc.restore();
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('PAIEMENT', margin + 14, y + 12);
            const brandLabel = (b?: string) =>
                !b ? 'Carte' : b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
            const card = order.paymentLast4
                ? `${brandLabel(order.paymentBrand)} •••• ${order.paymentLast4}`
                : order.paymentMethod === 'stripe'
                    ? 'Carte bancaire (Stripe)'
                    : order.paymentMethod
                        ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)
                        : 'Non renseigné';
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(10.5)
                .text(card, margin + 14, y + 26);
            const status = order.paymentStatus === 'paid'
                ? 'Payée'
                : order.paymentStatus ?? '—';
            doc.fillColor(INK_MUTED).font('Helvetica').fontSize(9)
                .text(`Statut · ${status}`, margin + 14, y + 41);

            /* ── Footer ────────────────────────────────────────── */
            const footerY = doc.page.height - 70;
            doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY).strokeColor(LINE).stroke();
            doc.fillColor(INK_MUTED).font('Helvetica').fontSize(8)
                .text('Merci pour votre commande chez Althea Systems.', margin, footerY + 10, {
                    width: contentW, align: 'center',
                })
                .text('Document généré électroniquement, sans signature requise. Conservez-le pour vos archives comptables.', margin, footerY + 22, {
                    width: contentW, align: 'center',
                })
                .fillColor(TEAL).fontSize(8.5).font('Helvetica-Bold')
                .text('althea.fr', margin, footerY + 38, { width: contentW, align: 'center' });

            doc.end();
        });
    }

    async persistInvoicePdf(invoiceId: string, buffer: Buffer): Promise<string> {
        const filePath = join(INVOICE_STORAGE_DIR, `${invoiceId}.pdf`);
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);
        return `storage/invoices/${invoiceId}.pdf`;
    }

    async readPersistedInvoicePdf(relativePath: string): Promise<Buffer | null> {
        try {
            const abs = resolve(process.cwd(), relativePath);
            return await fs.readFile(abs);
        } catch {
            return null;
        }
    }

    /**
     * Render an "AVOIR" PDF that mirrors the related invoice/order with negated totals.
     */
    generateCreditNotePdf(creditNote: CreditNote, order: Order): Promise<Buffer> {
        return new Promise((resolveFn, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolveFn(Buffer.concat(chunks)));
            doc.on('error', reject);

            const orderNumber = order.orderNumber ?? formatOrderNumber(order.id, order.createdAt);
            const pageW = doc.page.width;
            const margin = 50;
            const contentW = pageW - margin * 2;

            const currency = creditNote.currency || order.currency || 'EUR';
            const amountTtc = creditNote.amountTtcCents / 100; // negative

            doc.save();
            doc.rect(0, 0, pageW, 88).fill(NAVY);
            doc.roundedRect(margin, 24, 40, 40, 6).fill(TEAL);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
                .text('A+', margin + 9, 35, { width: 22, align: 'center', lineBreak: false });
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
                .text('Althea Systems', margin + 52, 30);
            doc.fillColor('#b3eef2').font('Helvetica').fontSize(9.5)
                .text('Materiel medical professionnel - ISO 13485', margin + 52, 52);
            doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
                .text('AVOIR', pageW - margin - 80, 38, { width: 80, align: 'right', lineBreak: false });
            doc.font('Helvetica').fontSize(9).fillColor('#b3eef2')
                .text(creditNote.number, pageW - margin - 200, 56, { width: 200, align: 'right', lineBreak: false });
            doc.restore();

            const metaTop = 110;
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('EMETTEUR', margin, metaTop);
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
                .text('Althea Systems SAS', margin, metaTop + 14);
            doc.fillColor(INK).font('Helvetica').fontSize(9.5)
                .text('12 rue de la Sante', margin, metaTop + 30)
                .text('75013 Paris, France', margin, metaTop + 43)
                .text('contact@althea.fr - +33 1 84 80 12 00', margin, metaTop + 56)
                .fillColor(INK_MUTED).fontSize(8.5)
                .text('SIRET 802 145 678 00012 - TVA FR12 802145678', margin, metaTop + 72);

            const metaX = margin + contentW * 0.55;
            const metaW = contentW * 0.45;
            doc.roundedRect(metaX, metaTop - 4, metaW, 110, 6).fillColor(PANEL).fill();
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('AVOIR', metaX + 14, metaTop + 4);
            const metaRow = (label: string, value: string, yPos: number) => {
                doc.fillColor(INK_MUTED).font('Helvetica').fontSize(8.5)
                    .text(label, metaX + 14, yPos);
                doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5)
                    .text(value, metaX + 14, yPos + 11, { width: metaW - 28 });
            };
            metaRow("N° d'avoir", creditNote.number, metaTop + 22);
            metaRow("Facture d'origine", orderNumber, metaTop + 50);
            metaRow(
                'Date',
                new Date(creditNote.issuedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                }),
                metaTop + 78,
            );

            const billY = metaTop + 130;
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('CLIENT', margin, billY);
            const addr = (order.billingAddress || order.shippingAddress) as unknown as
                | Record<string, string | undefined>
                | undefined;
            if (addr) {
                const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ');
                doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
                    .text(fullName || 'Client', margin, billY + 14);
                doc.fillColor(INK).font('Helvetica').fontSize(9.5);
                let yA = billY + 30;
                if (addr.street) { doc.text(String(addr.street), margin, yA); yA += 13; }
                if (addr.address2) { doc.text(String(addr.address2), margin, yA); yA += 13; }
                const cityLine = [addr.postalCode, addr.city, addr.region]
                    .filter(Boolean).join(' ');
                if (cityLine) { doc.text(cityLine, margin, yA); yA += 13; }
                if (addr.country) { doc.text(String(addr.country), margin, yA); yA += 13; }
            } else {
                doc.fillColor(INK_MUTED).fontSize(9.5).text('Adresse non renseignee.', margin, billY + 14);
            }

            const reasonY = 310;
            doc.save();
            doc.roundedRect(margin, reasonY, contentW, 40, 6).fillColor(PANEL).fill();
            doc.restore();
            doc.fillColor(INK_MUTED).font('Helvetica-Bold').fontSize(8.5)
                .text('MOTIF', margin + 14, reasonY + 10);
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
                .text(this.translateCreditNoteReason(creditNote.reason), margin + 14, reasonY + 22);

            const tableTop = reasonY + 60;
            const colProd = margin;
            const colQty = pageW - margin - 270;
            const colUnit = pageW - margin - 180;
            const colLine = pageW - margin - 90;
            const colEnd = pageW - margin;

            doc.save();
            doc.rect(margin, tableTop, contentW, 22).fill(NAVY);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
            doc.text('PRODUIT', colProd + 8, tableTop + 7);
            doc.text('QTE', colQty, tableTop + 7, { width: 60, align: 'right' });
            doc.text('PRIX UNITAIRE', colUnit, tableTop + 7, { width: 80, align: 'right' });
            doc.text('TOTAL HT', colLine, tableTop + 7, { width: 80, align: 'right' });
            doc.restore();

            let y = tableTop + 28;
            doc.font('Helvetica').fontSize(10).fillColor(INK);
            const rowH = 22;
            (order.items || []).forEach((item, i) => {
                if (i % 2 === 1) {
                    doc.save();
                    doc.rect(margin, y - 4, contentW, rowH).fillColor(PANEL).fill();
                    doc.restore();
                }
                const negQty = -item.quantity;
                const lineTotal = Number(item.price) * negQty;
                doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5)
                    .text(item.productName, colProd + 8, y, { width: colQty - colProd - 20 });
                if (item.productSku) {
                    doc.fillColor(INK_MUTED).font('Helvetica').fontSize(8.5)
                        .text(`Ref. ${item.productSku}`, colProd + 8, y + 11, { width: colQty - colProd - 20 });
                }
                doc.fillColor(INK).font('Helvetica').fontSize(10);
                doc.text(String(negQty), colQty, y + 4, { width: 60, align: 'right' });
                doc.text(this.formatPrice(Number(item.price), item.currency), colUnit, y + 4, { width: 80, align: 'right' });
                doc.font('Helvetica-Bold').fillColor(INK).text(
                    this.formatPrice(lineTotal, item.currency),
                    colLine,
                    y + 4,
                    { width: 80, align: 'right' },
                );
                y += rowH;
            });

            doc.moveTo(margin, y).lineTo(colEnd, y).strokeColor(LINE).stroke();

            y += 16;
            const totalsX = pageW - margin - 230;
            const totalsW = 230;
            const VAT_RATE = 0.2;
            const totalHt = amountTtc / (1 + VAT_RATE);
            const totalVat = amountTtc - totalHt;

            const totalRow = (label: string, value: string, opts: { bold?: boolean; emphasis?: boolean } = {}) => {
                doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
                doc.fontSize(opts.emphasis ? 12 : 9.5);
                doc.fillColor(opts.emphasis ? INK : INK_MUTED);
                doc.text(label, totalsX, y, { width: 130, align: 'right' });
                doc.fillColor(opts.emphasis ? NAVY : INK)
                    .font('Helvetica-Bold')
                    .text(value, totalsX + 130, y, { width: 100, align: 'right' });
                y += opts.emphasis ? 22 : 16;
            };
            totalRow('Sous-total HT', this.formatPrice(totalHt, currency));
            totalRow(`TVA (${(VAT_RATE * 100).toFixed(0)} %)`, this.formatPrice(totalVat, currency));
            doc.moveTo(totalsX, y - 4).lineTo(totalsX + totalsW, y - 4).strokeColor(LINE).stroke();
            y += 4;
            totalRow('Total avoir TTC', this.formatPrice(amountTtc, currency), {
                bold: true,
                emphasis: true,
            });

            const footerY2 = doc.page.height - 70;
            doc.moveTo(margin, footerY2).lineTo(pageW - margin, footerY2).strokeColor(LINE).stroke();
            doc.fillColor(INK_MUTED).font('Helvetica').fontSize(8)
                .text(`Avoir emis en reference a la facture ${orderNumber}.`, margin, footerY2 + 10, {
                    width: contentW, align: 'center',
                })
                .text('Document genere electroniquement, sans signature requise. Conservez-le pour vos archives comptables.', margin, footerY2 + 22, {
                    width: contentW, align: 'center',
                })
                .fillColor(TEAL).fontSize(8.5).font('Helvetica-Bold')
                .text('althea.fr', margin, footerY2 + 38, { width: contentW, align: 'center' });

            doc.end();
        });
    }

    async persistCreditNotePdf(creditNoteId: string, buffer: Buffer): Promise<string> {
        const filePath = join(CREDIT_NOTE_STORAGE_DIR, `${creditNoteId}.pdf`);
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);
        return `storage/credit-notes/${creditNoteId}.pdf`;
    }

    private translateCreditNoteReason(reason: string): string {
        const map: Record<string, string> = {
            cancellation: 'Annulation de commande',
            refund: 'Remboursement',
            error: "Correction d'erreur",
        };
        return map[reason] || reason;
    }

    private formatPrice(amount: number, currency: string): string {
        // Intl FR uses U+202F (narrow no-break space) and U+00A0 (no-break space)
        // for thousands grouping. PDFKit's default Helvetica font has no glyph
        // for either, so it falls back to a "/" — replace them with a regular space.
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency || 'EUR',
        })
            .format(amount)
            .replace(/[  ]/g, ' ');
    }
}
