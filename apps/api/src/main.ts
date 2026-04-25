import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-guest-cart-id, x-csrf-token',
  });

  app.use(helmet());
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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  console.log(`API ready on port ${port}`);
}

void bootstrap();
