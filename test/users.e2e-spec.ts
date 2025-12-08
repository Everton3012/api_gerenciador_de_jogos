import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Users API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurações do app (mesmas do main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    await app.init();

    // Obter DataSource para limpar banco entre testes
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Limpar dados de teste (opcional)
    // await dataSource.query('DELETE FROM users WHERE email LIKE "%@test.com"');
  });

  describe('POST /users', () => {
    it('deve criar um novo usuário com sucesso', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'João Silva',
          email: 'joao@test.com',
          password: 'SenhaSegura123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('João Silva');
          expect(res.body.email).toBe('joao@test.com');
          expect(res.body).not.toHaveProperty('password'); // Senha não deve ser retornada
          expect(res.body.provider).toBe('local');
          expect(res.body.plan).toBe('free');
          expect(res.body.isActive).toBe(true);
          userId = res.body.id;
        });
    });

    it('deve retornar 409 se o email já existe', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'João Silva',
          email: 'joao@test.com',
          password: 'SenhaSegura123!',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email já está em uso');
        });
    });

    it('deve retornar 400 se os dados forem inválidos', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'João',
          email: 'email-invalido',
          password: '123', // senha muito curta
        })
        .expect(400);
    });

    it('deve retornar 400 se faltar o email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'João Silva',
          password: 'SenhaSegura123!',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login (preparação para testes autenticados)', () => {
    it('deve fazer login e obter token JWT', async () => {
      // Primeiro, registrar um usuário para login
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'User Test',
          email: 'user@test.com',
          password: 'Password123!',
        });

      // Fazer login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      authToken = response.body.access_token;
    });
  });

  describe('GET /users', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('deve retornar lista de usuários com autenticação', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).not.toHaveProperty('password');
        });
    });

    it('deve respeitar o header Accept-Language', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'en')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  describe('GET /users/me', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('deve retornar o perfil do usuário autenticado', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('user@test.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });
  });

  describe('GET /users/:id', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(401);
    });

    it('deve retornar um usuário por ID', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(userId);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('deve retornar 404 para ID inexistente', () => {
      return request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /users/me', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'Novo Nome' })
        .expect(401);
    });

    it('deve atualizar o perfil do usuário autenticado', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Nome Atualizado');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('deve retornar 400 para dados inválidos', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'email-invalido' })
        .expect(400);
    });
  });

  describe('PATCH /users/:id', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ name: 'Novo Nome' })
        .expect(401);
    });

    it('deve atualizar um usuário por ID (requer admin)', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nome Admin' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Nome Admin');
        });
    });
  });

  describe('POST /users/me/change-password', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .post('/users/me/change-password')
        .send({
          oldPassword: 'Password123!',
          newPassword: 'NewPassword456!',
        })
        .expect(401);
    });

    it('deve alterar a senha com sucesso', () => {
      return request(app.getHttpServer())
        .post('/users/me/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'Password123!',
          newPassword: 'NewPassword456!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('alterada com sucesso');
        });
    });

    it('deve retornar 400 se a senha antiga estiver incorreta', () => {
      return request(app.getHttpServer())
        .post('/users/me/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'SenhaErrada123!',
          newPassword: 'NewPassword456!',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('incorreta');
        });
    });

    it('deve retornar 400 se a nova senha for muito curta', () => {
      return request(app.getHttpServer())
        .post('/users/me/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'NewPassword456!',
          newPassword: '123',
        })
        .expect(400);
    });
  });

  describe('POST /users/:id/upgrade', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/upgrade`)
        .expect(401);
    });

    it('deve fazer upgrade para premium (requer admin)', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/upgrade`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.plan).toBe('premium');
        });
    });

    it('deve retornar 400 se o usuário já é premium', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/upgrade`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('já é premium');
        });
    });
  });

  describe('POST /users/:id/downgrade', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/downgrade`)
        .expect(401);
    });

    it('deve fazer downgrade para free (requer admin)', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/downgrade`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.plan).toBe('free');
        });
    });

    it('deve retornar 400 se o usuário já é free', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/downgrade`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('já é free');
        });
    });
  });

  describe('DELETE /users/:id', () => {
    it('deve retornar 401 sem autenticação', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(401);
    });

    it('deve fazer soft delete do usuário', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('deve retornar 404 para usuário já deletado', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Testes de Multi-idioma', () => {
    it('deve retornar mensagens em português (padrão)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.message).toContain('não encontrado');
    });

    it('deve retornar mensagens em inglês', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'en')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });

    it('deve retornar mensagens em espanhol', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'es')
        .expect(404);

      expect(res.body.message).toContain('no encontrado');
    });
  });

  describe('Testes de Validação', () => {
    it('deve rejeitar campos não permitidos', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          extraField: 'não permitido', // Campo extra
        })
        .expect(400);
    });

    it('deve validar formato de email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Test User',
          email: 'email-invalido',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('deve validar tamanho mínimo da senha', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
        })
        .expect(400);
    });
  });
});