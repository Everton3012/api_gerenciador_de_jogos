// TypeScript
// test/plans-validation.e2e-spec.ts (atualizado)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { PlansService } from '../src/plans/plans.service'; // ✅ IMPORTAR O SERVICE

describe('Plans Validation (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let plansService: PlansService; // ✅ DECLARAR O SERVICE
  let userId: string;

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
    plansService = app.get(PlansService); // ✅ INJETAR O SERVICE CORRETAMENTE

    // Criar usuário Pro para testes
    await dataSource.query("DELETE FROM users WHERE email = 'pro-user@test.com'");
    
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Pro User',
        email: 'pro-user@test.com',
        password: 'Password123!',
      });

    userId = registerResponse.body.user.id;

    // Alterar plano para Pro
    await dataSource.query(`UPDATE users SET plan = 'pro' WHERE id = $1`, [userId]);

    // ✅ Invalidar cache do plano do usuário e da lista de planos
    const cacheManager = app.get('CACHE_MANAGER') as any;
    if (cacheManager) {
      await cacheManager.del(`user-plan:${userId}`);
      await cacheManager.del('plans:all');
    }

    // ✅ Verificar que o Plan 'pro' está disponível via service
    const userPlan = await plansService.getUserPlan(userId);
    expect(userPlan.id).toBe('pro');
    expect(userPlan.features.advancedStats).toBe(true);
    expect(userPlan.features.knockoutMode).toBe(true);
    expect(userPlan.features.teamManagement).toBe(true);
  });

  afterAll(async () => {
    try {
      await dataSource.query("DELETE FROM users WHERE email = 'pro-user@test.com'");
      
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
    } catch (error) {
      console.error('Erro no cleanup:', error);
    } finally {
      if (app) {
        await app.close();
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  describe('Validação de Limites de Plano', () => {
    it('deve validar limite de partidas do plano Free', async () => {
      // Criar usuário Free
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
      
      const freeUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Free User',
          email: 'free-user@test.com',
          password: 'Password123!',
        });

      const freeUserId = freeUserResponse.body.user.id;

      // Plano Free permite até 10 partidas
      const canCreate = await plansService.canCreateMatch(freeUserId, 5);
      expect(canCreate).toBe(true);

      // Não permite 11ª partida
      const cannotCreate = await plansService.canCreateMatch(freeUserId, 10);
      expect(cannotCreate).toBe(false);

      // Cleanup
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
    });

    it('deve validar limite de torneios do plano Free', async () => {
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
      
      const freeUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Free User',
          email: 'free-user@test.com',
          password: 'Password123!',
        });

      const freeUserId = freeUserResponse.body.user.id;

      const canCreate = await plansService.canCreateTournament(freeUserId, 0);
      expect(canCreate).toBe(true);

      const cannotCreate = await plansService.canCreateTournament(freeUserId, 1);
      expect(cannotCreate).toBe(false);

      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
    });

    it('deve validar acesso a funcionalidade no plano Free', async () => {
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
      
      const freeUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Free User',
          email: 'free-user@test.com',
          password: 'Password123!',
        });

      const freeUserId = freeUserResponse.body.user.id;

      const hasAdvancedStats = await plansService.checkFeatureAccess(freeUserId, 'advancedStats');
      expect(hasAdvancedStats).toBe(false);

      const hasKnockoutMode = await plansService.checkFeatureAccess(freeUserId, 'knockoutMode');
      expect(hasKnockoutMode).toBe(false);

      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
    });

    it('deve lançar erro ao tentar criar partida acima do limite', async () => {
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
      
      const freeUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Free User',
          email: 'free-user@test.com',
          password: 'Password123!',
        });

      const freeUserId = freeUserResponse.body.user.id;

      await expect(
        plansService.validateMatchCreation(freeUserId, 10)
      ).rejects.toThrow();

      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
    });

    it('deve lançar erro ao tentar criar torneio acima do limite', async () => {
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
      
      const freeUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Free User',
          email: 'free-user@test.com',
          password: 'Password123!',
        });

      const freeUserId = freeUserResponse.body.user.id;

      await expect(
        plansService.validateTournamentCreation(freeUserId, 1)
      ).rejects.toThrow();

      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
    });

    it('deve lançar erro ao tentar acessar feature não disponível', async () => {
      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
      
      const freeUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Free User',
          email: 'free-user@test.com',
          password: 'Password123!',
        });

      const freeUserId = freeUserResponse.body.user.id;

      await expect(
        plansService.validateFeatureAccess(freeUserId, 'advancedStats')
      ).rejects.toThrow();

      await dataSource.query("DELETE FROM users WHERE email = 'free-user@test.com'");
    });
  });

  describe('Plano Pro - Limites Ilimitados', () => {
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