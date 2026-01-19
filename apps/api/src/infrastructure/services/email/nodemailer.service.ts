import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
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
}
