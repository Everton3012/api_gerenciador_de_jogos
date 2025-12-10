import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM users');
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    it('deve registrar um novo usuário', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('deve retornar 409 se email já existe', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });

    it('deve retornar 401 com credenciais inválidas', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('deve renovar o token com refresh token válido', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const refreshToken = loginResponse.body.refresh_token;

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });

    it('deve retornar 401 com refresh token inválido', async () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'token_invalido' })
        .expect(401);
    });
  });

  describe('GET /auth/google', () => {
    it('deve redirecionar para Google OAuth', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);

      expect(response.header.location).toContain('accounts.google.com');
    });
  });

  describe('GET /auth/facebook', () => {
    it('deve redirecionar para Facebook OAuth', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/facebook')
        .expect(302);

      expect(response.header.location).toContain('facebook.com');
    });
  });

  describe('GET /auth/discord', () => {
    it('deve redirecionar para Discord OAuth', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/discord')
        .expect(302);

      expect(response.header.location).toContain('discord.com');
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      authToken = loginResponse.body.access_token;
    });

    it('deve retornar 401 sem autenticação', async () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('deve retornar dados do usuário autenticado', async () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });
  });
});