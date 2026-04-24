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
}
