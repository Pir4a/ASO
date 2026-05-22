import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import { type NextFunction, type Request, type Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
    bufferLogs: true,
  });

  // Hook pino as the app logger so Nest's bootstrap output, controller logs
  // and HTTP request lines all flow through the same structured pipeline.
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-guest-cart-id, x-csrf-token',
    // Needed so the invoice-download path on the web can read the server-set
    // filename (Content-Disposition is not in the CORS-safelist by default).
    exposedHeaders: ['Content-Disposition'],
  });

  // Helmet has to come before Swagger so the docs page can load its inline
  // assets — otherwise the default CSP blocks the embedded swagger-ui scripts.
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const raw = req.headers.cookie ?? '';
    if (!raw.includes('XSRF-TOKEN=')) {
      const token = randomBytes(24).toString('hex');
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.append(
        'Set-Cookie',
        `XSRF-TOKEN=${token}; Path=/; SameSite=Lax${secure}`,
      );
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // /api/docs — exposed in dev/staging only by default; flip SWAGGER_ENABLED
  // to "true" in prod to expose it there too. CDC §XVIII.3.b mandates an
  // interactive API doc surface (Swagger or Postman).
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Althea Systems API')
      .setDescription(
        [
          'REST endpoints for the Althea Systems e-commerce platform.',
          '',
          'All authenticated endpoints expect a Bearer JWT in the `Authorization` header.',
          'Cookie-based refresh + CSRF protection live on `/auth/refresh` and `/auth/logout`.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .setContact('Althea Systems', 'https://althea-group.com/fr/', 'contact@althea.fr')
      .setLicense('UNLICENSED', 'https://althea-group.com/fr/')
      .addServer(`http://localhost:${process.env.PORT ?? 3001}`, 'Local development')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
      .addTag('Auth', 'Signup, login, password reset, MFA, refresh.')
      .addTag('Profile', 'Authenticated user profile, addresses, MFA.')
      .addTag('Users (admin)', 'Backoffice user management — CDC §XVI.10.')
      .addTag('Products', 'Public catalogue, search, stock-notify subscriptions.')
      .addTag('Categories', 'Catalogue categories — flat tree (CDC §XVI.8).')
      .addTag('Cart', 'Guest + authenticated cart (CDC §IX).')
      .addTag('Checkout', 'Checkout orchestration + Stripe payment intents.')
      .addTag('Payment', 'Saved payment methods (CDC §XIII).')
      .addTag('Orders', 'Customer order history + detail (CDC §XIV).')
      .addTag('Orders (admin)', 'Backoffice order list, status updates, audit log.')
      .addTag('Invoices (admin)', 'Backoffice invoice CRUD + PDF + email (CDC §XVI.12).')
      .addTag('Credit notes (admin)', 'Backoffice avoirs (CDC §X.6).')
      .addTag('Content', 'Homepage carousel + content blocks (CDC §V).')
      .addTag('Contact', 'Public contact form + admin inbox (CDC §XV).')
      .addTag('Chat', 'AI chat sessions + admin escalation (CDC §XV).')
      .addTag('Media', 'Image uploads for products / carousel / categories.')
      .addTag('Health', 'Liveness probe.')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        tagsSorter: 'alpha',
      },
      customSiteTitle: 'Althea Systems API · Swagger UI',
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  console.log(`API ready on port ${port}`);
  if (swaggerEnabled) console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
