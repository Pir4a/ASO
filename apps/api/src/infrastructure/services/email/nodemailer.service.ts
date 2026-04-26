import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import {
  EmailGateway,
  SendOrderConfirmationOptions,
  CreditNoteEmailContext,
} from '../../../domain/gateways/email.gateway';
import type { Order } from '../../../domain/entities/order.entity';

type Locale = 'fr' | 'en';

const ORDER_CONFIRMATION_T: Record<Locale, Record<string, string>> = {
  fr: {
    subject: 'Confirmation de votre commande',
    greeting: 'Merci pour votre commande !',
    orderNumber: 'Numéro de commande',
    invoiceNumber: 'Numéro de facture',
    items: 'Articles',
    quantity: 'Qté',
    unitPrice: 'Prix unitaire',
    lineTotal: 'Total',
    shippingAddress: 'Adresse de livraison',
    total: 'Total TTC',
    viewOrder: 'Voir ma commande',
    footer: "Si vous avez des questions, n'hésitez pas à nous contacter.",
  },
  en: {
    subject: 'Your order confirmation',
    greeting: 'Thank you for your order!',
    orderNumber: 'Order number',
    invoiceNumber: 'Invoice number',
    items: 'Items',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    lineTotal: 'Total',
    shippingAddress: 'Shipping address',
    total: 'Total',
    viewOrder: 'View my order',
    footer: 'If you have any questions, feel free to contact us.',
  },
};

@Injectable()
export class NodemailerService implements EmailGateway {
  private readonly logger = new Logger(NodemailerService.name);
  private transporterPromise: Promise<Transporter> | null = null;

  private getTransporter(): Promise<Transporter> {
    if (!this.transporterPromise) {
      this.transporterPromise = this.createTransporter();
    }
    return this.transporterPromise;
  }

  private async createTransporter(): Promise<Transporter> {
    if (process.env.SMTP_HOST) {
      this.logger.log(
        `Using SMTP ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`,
      );
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      this.logger.log(
        `No SMTP_HOST set — using Ethereal test account ${testAccount.user}. Each email will be logged with a preview URL.`,
      );
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } catch (err) {
      this.logger.warn(
        `Ethereal unreachable (${(err as Error).message}). Falling back to jsonTransport — the verification link will be logged instead.`,
      );
      return nodemailer.createTransport({ jsonTransport: true });
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

    const transporter = await this.getTransporter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer's Transporter generic defaults to `any`
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Althea Shop" <no-reply@althea.local>',
      to,
      subject: 'Vérifiez votre compte Althea',
      html: `
                <h1>Bienvenue chez Althea !</h1>
                <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
                <p><a href="${verificationLink}">Vérifier mon compte</a></p>
                <p>Ce lien expirera dans 24 heures.</p>
            `,
    });

    this.logger.log(`Verification email sent to ${to}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- info is `any` from sendMail; nodemailer accepts it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    } else if (!process.env.SMTP_HOST) {
      this.logger.log(`Verification link (dev fallback): ${verificationLink}`);
    }
  }

  async sendPasswordResetEmail(to: string, token: string, _locale?: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const transporter = await this.getTransporter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer's Transporter generic defaults to `any`
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Althea Shop" <no-reply@althea.local>',
      to,
      subject: 'Réinitialisation de votre mot de passe Althea',
      html: `
                <h1>Réinitialisation de votre mot de passe</h1>
                <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
                <p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p>
                <p>Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
            `,
    });

    this.logger.log(`Password reset email sent to ${to}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- info is `any` from sendMail; nodemailer accepts it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    } else if (!process.env.SMTP_HOST) {
      this.logger.log(`Password reset link (dev fallback): ${resetLink}`);
    }
  }

  async sendInvoiceEmail(
    to: string,
    invoiceNumber: string,
    pdfBuffer: Buffer,
    orderNumber?: string,
    _locale?: string,
  ): Promise<void> {
    const transporter = await this.getTransporter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer's Transporter generic defaults to `any`
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Althea Shop" <no-reply@althea.local>',
      to,
      subject: `Votre facture Althea ${invoiceNumber}`,
      html: `
                <h1>Votre facture est disponible</h1>
                <p>Merci pour votre commande${orderNumber ? ` <strong>${orderNumber}</strong>` : ''}.</p>
                <p>Vous trouverez votre facture <strong>${invoiceNumber}</strong> en pièce jointe à cet e-mail.</p>
                <p>L'équipe Althea Systems</p>
            `,
      attachments: [
        {
          filename: `facture-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    this.logger.log(`Invoice email sent to ${to} for ${invoiceNumber}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- info is `any` from sendMail; nodemailer accepts it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    }
  }

  async sendEmailChangeConfirmation(
    newEmail: string,
    token: string,
    _locale?: string,
  ): Promise<void> {
    const confirmLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/confirm-email-change?token=${token}`;

    const transporter = await this.getTransporter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer's Transporter generic defaults to `any`
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Althea Shop" <no-reply@althea.local>',
      to: newEmail,
      subject: 'Confirmez votre nouvelle adresse e-mail Althea',
      html: `
                <h1>Confirmez votre nouvelle adresse</h1>
                <p>Vous avez demandé à modifier l'adresse e-mail liée à votre compte Althea. Pour finaliser le changement, cliquez sur le lien ci-dessous :</p>
                <p><a href="${confirmLink}">Confirmer mon nouvel e-mail</a></p>
                <p>Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
            `,
    });

    this.logger.log(`Email-change confirmation sent to ${newEmail}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- info is `any` from sendMail; nodemailer accepts it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    } else if (!process.env.SMTP_HOST) {
      this.logger.log(`Email-change confirmation link (dev fallback): ${confirmLink}`);
    }
  }

  async sendOrderConfirmation(
    to: string,
    order: Order,
    options: SendOrderConfirmationOptions = {},
  ): Promise<void> {
    const locale = this.resolveOrderLocale(options.locale);
    const t = ORDER_CONFIRMATION_T[locale];
    const orderUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}`;
    const html = this.buildOrderConfirmationHtml(order, orderUrl, t, options.invoiceNumber);

    const attachments = options.pdfBuffer
      ? [
          {
            filename: `${options.invoiceNumber || `commande-${order.id.slice(0, 8)}`}.pdf`,
            content: options.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    const transporter = await this.getTransporter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer's Transporter generic defaults to `any`
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Althea Shop" <no-reply@althea.local>',
      to,
      subject: `${t.subject} #${order.id.slice(0, 8)}`,
      html,
      attachments,
    });

    this.logger.log(`Order confirmation sent to ${to} for order ${order.id}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- info is `any` from sendMail; nodemailer accepts it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    }
  }

  private resolveOrderLocale(input?: string): Locale {
    const candidate = (input || process.env.DEFAULT_LOCALE || 'fr').toLowerCase();
    return candidate === 'en' ? 'en' : 'fr';
  }

  private buildOrderConfirmationHtml(
    order: Order,
    orderUrl: string,
    t: Record<string, string>,
    invoiceNumber?: string,
  ): string {
    const currency = order.currency || 'EUR';
    const formatPrice = (amount: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

    const itemsRows = (order.items || [])
      .map(
        (item) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${this.escapeHtml(item.productName)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `,
      )
      .join('');

    const addr = order.shippingAddress || ({} as Order['shippingAddress']);
    const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ');
    const addressLines = [
      fullName,
      addr.street,
      addr.address2,
      [addr.postalCode, addr.city].filter(Boolean).join(' '),
      addr.region,
      addr.country,
    ]
      .filter(Boolean)
      .map((line) => `<div>${this.escapeHtml(String(line))}</div>`)
      .join('');

    const invoiceBlock = invoiceNumber
      ? `<p><strong>${t.invoiceNumber} :</strong> ${this.escapeHtml(invoiceNumber)}</p>`
      : '';

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
          <h1>${t.greeting}</h1>
          <p><strong>${t.orderNumber} :</strong> ${this.escapeHtml(order.id)}</p>
          ${invoiceBlock}
          <h2 style="margin-top: 24px;">${t.items}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333;">${t.items}</th>
                <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333;">${t.quantity}</th>
                <th style="text-align: right; padding: 8px; border-bottom: 2px solid #333;">${t.unitPrice}</th>
                <th style="text-align: right; padding: 8px; border-bottom: 2px solid #333;">${t.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <p style="text-align: right; font-size: 16px; margin-top: 16px;">
            <strong>${t.total} :</strong> ${formatPrice(order.total)}
          </p>
          <h2 style="margin-top: 24px;">${t.shippingAddress}</h2>
          <div>${addressLines}</div>
          <p style="margin-top: 32px;">
            <a href="${orderUrl}" style="background: #111; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px;">
              ${t.viewOrder}
            </a>
          </p>
          <p style="margin-top: 32px; font-size: 12px; color: #666;">${t.footer}</p>
        </div>
      `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendCreditNoteEmail(
    to: string,
    context: CreditNoteEmailContext,
    pdfBuffer: Buffer,
  ): Promise<void> {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: context.currency || 'EUR',
    }).format(context.amountTtc);
    const issuedDate = new Date(context.issuedAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const transporter = await this.getTransporter();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer's Transporter generic defaults to `any`
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Althea Shop" <no-reply@althea.local>',
      to,
      subject: `Avoir Althea ${context.number}`,
      html: `
                <h1>Avoir émis</h1>
                <p>Bonjour,</p>
                <p>Nous vous confirmons l'émission d'un avoir <strong>${context.number}</strong> en référence à la facture <strong>${context.invoiceReference}</strong>.</p>
                <ul>
                    <li><strong>Date :</strong> ${issuedDate}</li>
                    <li><strong>Motif :</strong> ${context.reason}</li>
                    <li><strong>Montant TTC :</strong> ${formatted}</li>
                </ul>
                <p>Le document est joint à cet e-mail pour vos archives comptables.</p>
                <p>L'équipe Althea Systems</p>
            `,
      attachments: [
        {
          filename: `${context.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    this.logger.log(`Credit note email sent to ${to} for ${context.number}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- info is `any` from sendMail; nodemailer accepts it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    }
  }
}
