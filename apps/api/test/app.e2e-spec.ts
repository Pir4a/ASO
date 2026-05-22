import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthController } from './../src/health/health.controller';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

/**
 * Functional smoke e2e — boots a trimmed Nest app with only the
 * dependency-free controllers (Health + Hello) so the suite does not require
 * Postgres, Mongo, Redis or env vars to run locally. The HTTP layer, routing
 * and JSON serialisation are exercised end-to-end via supertest.
 */
describe('App (e2e — smoke)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, HealthController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api → hello', async () => {
    await request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /api/health → { status: "ok", date }', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.date).toBe('string');
    expect(Number.isFinite(Date.parse(res.body.date))).toBe(true);
  });

  it('GET /api/does-not-exist → 404', async () => {
    await request(app.getHttpServer()).get('/api/does-not-exist').expect(404);
  });
});
