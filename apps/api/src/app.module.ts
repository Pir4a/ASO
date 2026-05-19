import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocalizeInterceptor } from './infrastructure/interceptors/localize.interceptor';
import { UsersModule } from './infrastructure/ioc/users.module';
import { AuthModule } from './infrastructure/ioc/auth.module';
import { ProductsModule } from './infrastructure/ioc/products.module';
import { CategoriesModule } from './infrastructure/ioc/categories.module';
import { CartModule } from './infrastructure/ioc/cart.module';
import { OrdersModule } from './infrastructure/ioc/orders.module';
import { AddressModule } from './infrastructure/ioc/address.module';
import { ContentModule } from './infrastructure/ioc/content.module';
import { PaymentModule } from './infrastructure/ioc/payment.module';
import { ContactModule } from './infrastructure/ioc/contact.module';
import { ChatModule } from './infrastructure/ioc/chat.module';
import { InvoicesModule } from './infrastructure/ioc/invoices.module';
import { CreditNotesModule } from './infrastructure/ioc/credit-notes.module';
import { MediaModule } from './infrastructure/ioc/media.module';
import { typeOrmNestOptions } from './db/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        // Pretty-print in dev, structured JSON in prod.
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'HH:MM:ss.l' },
              },
        // Stable request id (echoed back as `x-request-id` for tracing).
        genReqId: (req: IncomingMessage) => {
          const incoming = req.headers['x-request-id'];
          const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
          return fromHeader || randomUUID();
        },
        customProps: () => ({ service: 'althea-api' }),
        // Redact PII / secrets that occasionally show up in request bodies
        // and serialized objects.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.newPassword',
            'req.body.currentPassword',
            'req.body.passwordHash',
            'req.body.token',
            'req.body.paymentIntentId',
            'res.headers["set-cookie"]',
            '*.password',
            '*.passwordHash',
            '*.passwordResetToken',
            '*.verificationToken',
            '*.pendingEmailToken',
            '*.paymentMethodId',
          ],
          censor: '[redacted]',
        },
        // Bump 5xx to ERROR, 4xx to WARN, success to INFO.
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot(typeOrmNestOptions),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGODB_URI ||
          'mongodb://mongo:mongo@mongo:27017/althea?authSource=admin',
      }),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    AddressModule,
    ContentModule,
    PaymentModule,
    ContactModule,
    ChatModule,
    InvoicesModule,
    CreditNotesModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LocalizeInterceptor },
  ],
})
export class AppModule {}
