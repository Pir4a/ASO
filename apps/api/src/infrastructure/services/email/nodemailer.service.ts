import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import {
  EmailGateway,
  SendOrderConfirmationOptions,
  CreditNoteEmailContext,
} from '../../../domain/gateways/email.gateway';
import type { Order } from '../../../domain/entities/order.entity';
import { resolveOrderNumber } from '../../../application/use-cases/orders/get-order-details.use-case';
import { getEmailLogoAttachment, wrapEmailHtml } from './email-layout';
import type { Attachment } from 'nodemailer/lib/mailer';

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
    invoiceAttached:
      'Votre facture PDF est jointe à cet e-mail (pièce jointe).',
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
    invoiceAttached: 'Your invoice PDF is attached to this email.',
    footer: 'If you have any questions, feel free to contact us.',
  },
};

function defaultFrom(): string {
  return process.env.SMTP_FROM || '"Althea Systems" <no-reply@althea.local>';
}

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

  /** Sends HTML with shared layout + inline logo; extra attachments appended after logo. */
  private async mail(
    to: string,
    subject: string,
    bodyHtml: string,
    extraAttachments?: Attachment[],
    devLogLink?: string,
  ): Promise<void> {
    const transporter = await this.getTransporter();
    const attachments: Attachment[] = [...(extraAttachments ?? [])];
    const logo = getEmailLogoAttachment();
    if (logo) attachments.unshift(logo);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nodemailer SendMailOptions
    const info = await transporter.sendMail({
      from: defaultFrom(),
      to,
      subject,
      html: wrapEmailHtml(bodyHtml),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`Ethereal preview: ${previewUrl}`);
    } else if (devLogLink && !process.env.SMTP_HOST) {
      this.logger.log(`Email dev fallback link: ${devLogLink}`);
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

    await this.mail(
      to,
      'Activez votre compte Althea Systems',
      `
          <h1 style="color:#003d5c;font-size:22px;margin:0 0 16px">Bienvenue chez Althea Systems</h1>
          <p>Merci pour votre inscription. Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
          <p style="margin:28px 0">
            <a href="${verificationLink}" style="background:#00a8b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Vérifier mon adresse e-mail
            </a>
          </p>
          <p style="font-size:13px;color:#555">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez ce message.</p>
      `,
      undefined,
      verificationLink,
    );

    this.logger.log(`Verification email sent to ${to}`);
  }

  async sendPasswordResetEmail(to: string, token: string, _locale?: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await this.mail(
      to,
      'Réinitialisation de votre mot de passe Althea Systems',
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Réinitialisation du mot de passe</h1>
          <p>Cliquez sur le bouton pour choisir un nouveau mot de passe :</p>
          <p style="margin:24px 0">
            <a href="${resetLink}" style="background:#00a8b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p style="font-size:13px;color:#555">Ce lien expire dans 24 heures.</p>
      `,
      undefined,
      resetLink,
    );

    this.logger.log(`Password reset email sent to ${to}`);
  }

  async sendInvoiceEmail(
    to: string,
    invoiceNumber: string,
    pdfBuffer: Buffer,
    orderNumber?: string,
    _locale?: string,
  ): Promise<void> {
    await this.mail(
      to,
      `Votre facture Althea Systems ${invoiceNumber}`,
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Votre facture</h1>
          <p>Merci pour votre commande${orderNumber ? ` <strong>${this.escapeHtml(orderNumber)}</strong>` : ''}.</p>
          <p>La facture <strong>${this.escapeHtml(invoiceNumber)}</strong> est jointe à cet e-mail au format PDF.</p>
      `,
      [
        {
          filename: `facture-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    );

    this.logger.log(`Invoice email sent to ${to} for ${invoiceNumber}`);
  }

  async sendEmailChangeConfirmation(
    newEmail: string,
    token: string,
    _locale?: string,
  ): Promise<void> {
    const confirmLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/confirm-email-change?token=${token}`;

    await this.mail(
      newEmail,
      'Confirmez votre nouvelle adresse e-mail Althea Systems',
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Nouvelle adresse e-mail</h1>
          <p>Confirmez le changement d'adresse pour votre compte :</p>
          <p style="margin:24px 0">
            <a href="${confirmLink}" style="background:#00a8b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Confirmer mon e-mail
            </a>
          </p>
          <p style="font-size:13px;color:#555">Ce lien expire dans 24 heures.</p>
      `,
      undefined,
      confirmLink,
    );

    this.logger.log(`Email-change confirmation sent to ${newEmail}`);
  }

  async sendOrderConfirmation(
    to: string,
    order: Order,
    options: SendOrderConfirmationOptions = {},
  ): Promise<void> {
    const locale = this.resolveOrderLocale(options.locale);
    const t = ORDER_CONFIRMATION_T[locale];
    const displayOrderNumber = resolveOrderNumber(order);
    const orderUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}`;
    const html = this.buildOrderConfirmationHtml(
      order,
      orderUrl,
      t,
      displayOrderNumber,
      options.invoiceNumber,
    );

    const hasInvoicePdf = Boolean(options.pdfBuffer && options.invoiceNumber);
    const attachments = hasInvoicePdf
      ? [
          {
            filename: `facture-${options.invoiceNumber}.pdf`,
            content: options.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    const subject = hasInvoicePdf
      ? `${t.subject} — facture ${options.invoiceNumber}`
      : `${t.subject} ${displayOrderNumber}`;

    await this.mail(to, subject, html, attachments);

    this.logger.log(
      `Order confirmation sent to ${to} for order ${order.id}${hasInvoicePdf ? ' (invoice PDF attached)' : ''}`,
    );
  }

  private resolveOrderLocale(input?: string): Locale {
    const candidate = (input || process.env.DEFAULT_LOCALE || 'fr').toLowerCase();
    return candidate === 'en' ? 'en' : 'fr';
  }

  private buildOrderConfirmationHtml(
    order: Order,
    orderUrl: string,
    t: Record<string, string>,
    displayOrderNumber: string,
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
      ? `<p><strong>${t.invoiceNumber} :</strong> ${this.escapeHtml(invoiceNumber)}</p>
         <p style="background:#e8f7f8;border-left:4px solid #00a8b5;padding:12px 14px;border-radius:4px;font-size:14px;">
           ${t.invoiceAttached}
         </p>`
      : '';

    return `
          <h1 style="color:#003d5c;font-size:22px;margin:0 0 12px">${t.greeting}</h1>
          <p><strong>${t.orderNumber} :</strong> ${this.escapeHtml(displayOrderNumber)}</p>
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
          <p style="margin-top: 28px;">
            <a href="${orderUrl}" style="background:#003d5c;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600">
              ${t.viewOrder}
            </a>
          </p>
          <p style="margin-top:24px;font-size:12px;color:#666">${t.footer}</p>
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

    await this.mail(
      to,
      `Avoir Althea Systems ${context.number}`,
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Avoir émis</h1>
          <p>Avoir <strong>${this.escapeHtml(context.number)}</strong> — facture <strong>${this.escapeHtml(context.invoiceReference)}</strong>.</p>
          <ul>
            <li><strong>Date :</strong> ${issuedDate}</li>
            <li><strong>Motif :</strong> ${this.escapeHtml(context.reason)}</li>
            <li><strong>Montant TTC :</strong> ${formatted}</li>
          </ul>
          <p>Le document PDF est joint à cet e-mail.</p>
      `,
      [
        {
          filename: `${context.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    );

    this.logger.log(`Credit note email sent to ${to} for ${context.number}`);
  }

  async sendGuestSignupEmail(
    to: string,
    token: string,
    orderId: string,
    _locale?: string,
  ): Promise<void> {
    const setupLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&welcome=1`;
    const orderShort = orderId.slice(0, 8);

    await this.mail(
      to,
      'Suivez votre commande Althea Systems',
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Merci pour votre commande</h1>
          <p>Commande <strong>${orderShort}</strong> enregistrée.</p>
          <p>Créez votre mot de passe pour suivre la commande :</p>
          <p style="margin:24px 0">
            <a href="${setupLink}" style="background:#00a8b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Créer mon mot de passe
            </a>
          </p>
          <p style="font-size:13px;color:#555">Lien valable 24 h.</p>
      `,
      undefined,
      setupLink,
    );

    this.logger.log(`Guest signup email sent to ${to} for order ${orderId}`);
  }

  async sendStockNotifyConfirmationEmail(
    to: string,
    productName: string,
    productSlug: string,
  ): Promise<void> {
    const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${encodeURIComponent(productSlug)}`;
    const safeName = this.escapeHtml(productName);

    await this.mail(
      to,
      `Alerte stock confirmée — ${productName}`,
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Demande enregistrée</h1>
          <p>Merci — votre alerte pour <strong>${safeName}</strong> est bien enregistrée.</p>
          <p>Dès que ce produit sera de nouveau disponible, nous vous enverrons un e-mail à cette adresse.</p>
          <p style="margin:24px 0">
            <a href="${productUrl}" style="background:#00a8b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Voir le produit
            </a>
          </p>
          <p style="font-size:13px;color:#555">Pour vous désabonner, rendez-vous sur la fiche produit et cliquez sur « Se désabonner ».</p>
      `,
    );

    this.logger.log(`Stock notify confirmation sent to ${to} for ${productSlug}`);
  }

  async sendProductBackInStockEmail(
    to: string,
    productName: string,
    productSlug: string,
  ): Promise<void> {
    const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${encodeURIComponent(productSlug)}`;
    const safeName = this.escapeHtml(productName);

    await this.mail(
      to,
      `${productName} est de nouveau disponible`,
      `
          <h1 style="color:#003d5c;font-size:20px;margin:0 0 12px">Bonne nouvelle !</h1>
          <p>Le produit <strong>${safeName}</strong> que vous suiviez est de nouveau en stock.</p>
          <p style="margin:24px 0">
            <a href="${productUrl}" style="background:#00a8b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Voir le produit
            </a>
          </p>
          <p style="font-size:13px;color:#555">Vous recevez ce message car vous vous êtes inscrit à l'alerte stock. Pour vous désabonner, rendez-vous sur la fiche produit.</p>
      `,
    );

    this.logger.log(`Back-in-stock email sent to ${to} for ${productSlug}`);
  }

  async sendChatReply(to: string, subject: string, content: string): Promise<void> {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    await this.mail(
      to,
      `Re: ${subject}`,
      `
          <p>Bonjour,</p>
          <p>Notre équipe support a répondu à votre demande&nbsp;:</p>
          <blockquote style="border-left:4px solid #00a8b5;padding:8px 12px;color:#333;margin:16px 0">
            ${escaped}
          </blockquote>
          <p>Bien cordialement,<br/>L'équipe Althea Systems</p>
      `,
    );

    this.logger.log(`Chat reply email sent to ${to}`);
  }
}
