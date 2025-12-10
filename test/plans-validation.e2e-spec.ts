// test/plans-validation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { PlansService } from '../src/plans/plans.service';

describe('Plans Validation (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let plansService: PlansService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    plansService = app.get(PlansService);

    await dataSource.query("DELETE FROM users WHERE email = 'plans-validation@test.com'");

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Plans Validation User',
        email: 'plans-validation@test.com',
        password: 'Password123!',
      });

    authToken = registerResponse.body.access_token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    try {
      await dataSource.query("DELETE FROM users WHERE email = 'plans-validation@test.com'");
      if (dataSource?.isInitialized) await dataSource.destroy();
    } catch (error) {
      console.error('Erro no cleanup:', error);
    } finally {
      if (app) await app.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  describe('Validação de Limites de Plano', () => {
    it('deve validar limite de partidas do plano Free', async () => {
      const canCreate = await plansService.canCreateMatch(userId, 5);
      expect(canCreate).toBe(true);
    });

    it('deve negar criação de partida ao atingir limite Free (10)', async () => {
      const canCreate = await plansService.canCreateMatch(userId, 10);
      expect(canCreate).toBe(false);
    });

    it('deve validar limite de torneios do plano Free', async () => {
      const canCreate = await plansService.canCreateTournament(userId, 0);
      expect(canCreate).toBe(true);
    });

    it('deve negar criação de torneio ao atingir limite Free (1)', async () => {
      const canCreate = await plansService.canCreateTournament(userId, 1);
      expect(canCreate).toBe(false);
    });

    it('deve validar acesso a funcionalidade no plano Free', async () => {
      const hasAccess = await plansService.checkFeatureAccess(userId, 'advancedStats');
      expect(hasAccess).toBe(false);
    });

    it('deve lançar erro ao tentar criar partida acima do limite', async () => {
      await expect(
        plansService.validateMatchCreation(userId, 10)
      ).rejects.toThrow();
    });

    it('deve lançar erro ao tentar criar torneio acima do limite', async () => {
      await expect(
        plansService.validateTournamentCreation(userId, 1)
      ).rejects.toThrow();
    });

    it('deve lançar erro ao tentar acessar feature não disponível', async () => {
      await expect(
        plansService.validateFeatureAccess(userId, 'advancedStats')
      ).rejects.toThrow();
    });
  });

  describe('Plano Pro - Limites Ilimitados', () => {
    beforeAll(async () => {
      // Upgrade para Pro
      await request(app.getHttpServer())
        .post(`/users/${userId}/upgrade`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('deve permitir partidas ilimitadas no plano Pro', async () => {
      const canCreate = await plansService.canCreateMatch(userId, 1000);
      expect(canCreate).toBe(true);
    });

    it('deve permitir torneios ilimitados no plano Pro', async () => {
      const canCreate = await plansService.canCreateTournament(userId, 1000);
      expect(canCreate).toBe(true);
    });

    it('deve permitir acesso a stats avançadas no plano Pro', async () => {
      const hasAccess = await plansService.checkFeatureAccess(userId, 'advancedStats');
      expect(hasAccess).toBe(true);
    });

    it('deve permitir acesso a knockout mode no plano Pro', async () => {
      const hasAccess = await plansService.checkFeatureAccess(userId, 'knockoutMode');
      expect(hasAccess).toBe(true);
    });

    it('deve permitir acesso a team management no plano Pro', async () => {
      const hasAccess = await plansService.checkFeatureAccess(userId, 'teamManagement');
      expect(hasAccess).toBe(true);
    });
  });
});