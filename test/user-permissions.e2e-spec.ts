// test/user-permissions.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UsersService } from '../src/users/users.service';

describe('User Permissions (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersService: UsersService;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    usersService = app.get(UsersService);

    await dataSource.query("DELETE FROM users WHERE email = 'permissions@test.com'");

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Permissions User',
        email: 'permissions@test.com',
        password: 'Password123!',
      });

    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    try {
      await dataSource.query("DELETE FROM users WHERE email = 'permissions@test.com'");
      if (dataSource?.isInitialized) await dataSource.destroy();
    } catch (error) {
      console.error('Erro no cleanup:', error);
    } finally {
      if (app) await app.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  describe('Validação de Permissões por Plano', () => {
    it('deve verificar se usuário Free pode executar ação básica', async () => {
      const canPerform = await usersService.canPerformAction(userId, 'basic');
      expect(canPerform).toBe(true);
    });

    it('deve negar ação knockout para usuário Free', async () => {
      const canPerform = await usersService.canPerformAction(userId, 'knockout');
      expect(canPerform).toBe(false);
    });

    it('deve retornar limites corretos para plano Free', async () => {
      const limits = await usersService.getUserLimits(userId);
      expect(limits.maxMatchesPerMonth).toBe(10);
      expect(limits.maxTournamentsPerMonth).toBe(1);
    });
  });

  describe('Plano Pro - Permissões Expandidas', () => {
    beforeAll(async () => {
      await usersService.upgradeToPro(userId);
    });

    it('deve permitir knockout mode no plano Pro', async () => {
      const canPerform = await usersService.canPerformAction(userId, 'knockout');
      expect(canPerform).toBe(true);
    });

    it('deve permitir stats avançadas no plano Pro', async () => {
      const canPerform = await usersService.canPerformAction(userId, 'advanced_stats');
      expect(canPerform).toBe(true);
    });

    it('deve retornar limites ilimitados para plano Pro', async () => {
      const limits = await usersService.getUserLimits(userId);
      expect(limits.maxMatchesPerMonth).toBeNull();
      expect(limits.maxTournamentsPerMonth).toBeNull();
    });
  });
});