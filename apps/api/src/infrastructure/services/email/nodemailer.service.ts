import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { EmailGateway } from '../../../domain/gateways/email.gateway';

@Injectable()
export class NodemailerService implements EmailGateway {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Use Ethereal for dev if no real SMTP provided
        if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            // Fallback for dev: console log or create test account (simplified for now)
            console.log('No SMTP config found, emails will be logged only.');
            this.transporter = nodemailer.createTransport({
                jsonTransport: true,
            });
        }
    }

    async sendVerificationEmail(to: string, token: string): Promise<void> {
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;

        const info = await this.transporter.sendMail({
            from: '"Althea Shop" <no-reply@althea.local>',
            to,
            subject: 'Vérifiez votre compte Althea',
            html: `
                <h1>Bienvenue chez Althea !</h1>
                <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
                <p><a href="${verificationLink}">Vérifier mon compte</a></p>
                <p>Ce lien expirera dans 24 heures.</p>
            `,
        });

        console.log(`Verification email sent to ${to}. Link: ${verificationLink}`);
        if (info.messageId) {
            console.log('Message ID:', info.messageId);
        }
    }

    async sendOrderConfirmationEmail(
        to: string,
        payload: {
            orderId: string;
            total: number;
            currency: string;
            items: Array<{ name: string; sku?: string; quantity: number; price: number }>;
            invoiceUrl?: string;
            customerName?: string;
        }
    ): Promise<void> {
        const template = this.loadTemplate('order-confirmation.hbs');
        const itemsHtml = payload.items.map(item => `
            <tr>
              <td style="padding: 6px 0;">${item.name}</td>
              <td style="padding: 6px 0;">${item.sku || '-'}</td>
              <td style="padding: 6px 0; text-align:center;">${item.quantity}</td>
              <td style="padding: 6px 0; text-align:right;">${this.formatPrice(item.price, payload.currency)}</td>
            </tr>
        `).join('');

        const html = this.renderTemplate(template, {
            customerName: payload.customerName || 'Client',
            orderId: payload.orderId,
            total: this.formatPrice(payload.total, payload.currency),
            invoiceUrl: payload.invoiceUrl || '',
            invoiceSection: payload.invoiceUrl
                ? `<p>Votre facture est disponible ici : <a href="${payload.invoiceUrl}">Telecharger la facture</a></p>`
                : '',
            items: itemsHtml,
        });

        const info = await this.transporter.sendMail({
            from: '"Althea Shop" <no-reply@althea.local>',
            to,
            subject: 'Confirmation de votre commande Althea',
            html,
        });

        console.log(`Order confirmation email sent to ${to}. Order: ${payload.orderId}`);
        if (info.messageId) {
            console.log('Message ID:', info.messageId);
        }
    }

    async sendContactConfirmationEmail(to: string, name: string): Promise<void> {
        const info = await this.transporter.sendMail({
            from: '"Althea Support" <support@althea.local>',
            to,
            subject: 'Confirmation de réception de votre message',
            html: `
                <h1>Message reçu !</h1>
                <p>Cher ${name},</p>
                <p>Nous avons bien reçu votre message. Notre équipe va l'examiner et vous répondra dans les plus brefs délais.</p>

                <p>Si votre demande est urgente, vous pouvez nous contacter directement au :</p>
                <ul>
                    <li>Téléphone: +33 1 23 45 67 89</li>
                    <li>Email: support@althea.local</li>
                </ul>

                <p>Nous vous remercions de votre intérêt pour Althea Systems.</p>
                <p>Cordialement,<br>L'équipe Althea</p>
            `,
        });

        console.log(`Contact confirmation email sent to ${to}. Name: ${name}`);
        if (info.messageId) {
            console.log('Message ID:', info.messageId);
        }
    }

    async sendContactReplyEmail(to: string, name: string, subject: string, reply: string, originalMessage: string): Promise<void> {
        const info = await this.transporter.sendMail({
            from: '"Althea Support" <support@althea.local>',
            to,
            subject: `Re: ${subject}`,
            html: `
                <h1>Réponse à votre message</h1>
                <p>Cher ${name},</p>

                <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #00a8b5;">
                    <p><strong>Votre message original :</strong></p>
                    <p>${originalMessage.replace(/\n/g, '<br>')}</p>
                </div>

                <p><strong>Notre réponse :</strong></p>
                <p>${reply.replace(/\n/g, '<br>')}</p>

                <p>Si vous avez d'autres questions, n'hésitez pas à nous contacter.</p>

                <p>Cordialement,<br>L'équipe Althea<br>support@althea.local</p>
            `,
        });

        console.log(`Contact reply email sent to ${to}. Subject: ${subject}`);
        if (info.messageId) {
            console.log('Message ID:', info.messageId);
        }
    }

    private loadTemplate(fileName: string): string {
        const candidatePaths = [
            path.resolve(process.cwd(), 'src', 'infrastructure', 'services', 'email', 'templates', fileName),
            path.resolve(process.cwd(), 'apps', 'api', 'src', 'infrastructure', 'services', 'email', 'templates', fileName),
        ];

        for (const candidate of candidatePaths) {
            if (fs.existsSync(candidate)) {
                return fs.readFileSync(candidate, 'utf-8');
            }
        }

        return '<p>Bonjour {{customerName}},</p><p>Votre commande {{orderId}} est confirmée.</p>';
    }

    private renderTemplate(template: string, variables: Record<string, string>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
    }

    private formatPrice(amount: number, currency: string): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency || 'EUR',
        }).format(amount);
    }
}
