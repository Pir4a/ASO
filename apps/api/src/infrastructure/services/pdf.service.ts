import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class PdfService {
    generateInvoice(order: Order): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('FACTURE', { align: 'center' });
            doc.moveDown();

            // Company info (placeholder)
            doc.fontSize(10).font('Helvetica')
                .text('E-Commerce Store', { align: 'left' })
                .text('123 Commerce Street')
                .text('75001 Paris, France')
                .text('contact@store.com');
            doc.moveDown();

            // Invoice details
            doc.fontSize(12).font('Helvetica-Bold').text('Détails de la facture');
            doc.fontSize(10).font('Helvetica')
                .text(`Numéro de commande: ${order.id}`)
                .text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`)
                .text(`Statut: ${this.translateStatus(order.status)}`);
            doc.moveDown();

            // Shipping address
            if (order.shippingAddress) {
                doc.fontSize(12).font('Helvetica-Bold').text('Adresse de livraison');
                doc.fontSize(10).font('Helvetica');
                const addr = order.shippingAddress as Record<string, any>;
                // Handle different address field formats
                const name = addr.name || (addr.firstName && addr.lastName ? `${addr.firstName} ${addr.lastName}` : null);
                if (name) doc.text(name);
                if (addr.street) doc.text(addr.street);
                if (addr.line1) doc.text(addr.line1);
                if (addr.line2) doc.text(addr.line2);
                const postal = addr.postalCode || addr.postal_code || '';
                const city = addr.city || '';
                if (postal || city) doc.text(`${postal} ${city}`.trim());
                if (addr.country) doc.text(addr.country);
                doc.moveDown();
            }

            // Items table
            doc.fontSize(12).font('Helvetica-Bold').text('Articles commandés');
            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 280;
            const col3 = 350;
            const col4 = 420;
            const col5 = 490;

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Produit', col1, tableTop);
            doc.text('Réf.', col2, tableTop);
            doc.text('Qté', col3, tableTop);
            doc.text('Prix unit.', col4, tableTop);
            doc.text('Total', col5, tableTop);

            doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table rows
            let y = tableTop + 25;
            doc.font('Helvetica').fontSize(9);

            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    const itemTotal = item.price * item.quantity;

                    // Truncate product name if too long
                    const productName = item.productName.length > 35
                        ? item.productName.substring(0, 32) + '...'
                        : item.productName;

                    doc.text(productName, col1, y, { width: 220 });
                    doc.text(item.productSku || '-', col2, y);
                    doc.text(item.quantity.toString(), col3, y);
                    doc.text(this.formatPrice(item.price, item.currency), col4, y);
                    doc.text(this.formatPrice(itemTotal, item.currency), col5, y);

                    y += 20;
                }
            }

            // Total line
            doc.moveTo(col1, y + 5).lineTo(550, y + 5).stroke();
            y += 15;

            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('TOTAL TTC:', col4, y);
            doc.text(this.formatPrice(order.total, order.currency), col5, y);

            // Footer
            doc.fontSize(8).font('Helvetica')
                .text(
                    'Merci pour votre commande !',
                    50,
                    doc.page.height - 80,
                    { align: 'center' }
                )
                .text(
                    'Cette facture est générée automatiquement et ne nécessite pas de signature.',
                    { align: 'center' }
                );

            doc.end();
        });
    }

    private translateStatus(status: string): string {
        const translations: Record<string, string> = {
            'pending': 'En attente',
            'processing': 'En cours de traitement',
            'shipped': 'Expédié',
            'delivered': 'Livré',
            'cancelled': 'Annulé',
        };
        return translations[status] || status;
    }

    private formatPrice(amount: number, currency: string): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency || 'EUR',
        }).format(amount);
    }
}
