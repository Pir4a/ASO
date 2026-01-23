import { Module } from '@nestjs/common';
import { EMAIL_GATEWAY } from '../../domain/gateways/email.gateway';
import { NodemailerService } from '../services/email/nodemailer.service';

@Module({
    providers: [
        {
            provide: EMAIL_GATEWAY,
            useClass: NodemailerService,
        },
    ],
    exports: [EMAIL_GATEWAY],
})
export class NotificationModule { }
