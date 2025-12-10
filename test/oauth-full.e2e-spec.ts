// test/oauth-full.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('OAuth Complete Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) await dataSource.destroy();
    } catch (error) {
      console.error('Erro no cleanup:', error);
    } finally {
      if (app) await app.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  describe('OAuth Provider Mapping', () => {
    it('deve mapear Google provider corretamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);
      expect(response.header.location).toContain('google');
    });

    it('deve mapear Facebook provider corretamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/facebook')
        .expect(302);
      expect(response.header.location).toContain('facebook');
    });

    it('deve mapear Discord provider corretamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/discord')
        .expect(302);
      expect(response.header.location).toContain('discord');
    });
  });
});