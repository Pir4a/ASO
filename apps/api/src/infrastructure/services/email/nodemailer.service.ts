import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { EmailGateway } from '../../../domain/gateways/email.gateway';

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
}
