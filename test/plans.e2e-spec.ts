// test/plans.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Plans API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
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

    // Criar usuário e fazer login para testes autenticados
    await dataSource.query("DELETE FROM users WHERE email = 'plans-test@example.com'");
    
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Plans Test User',
        email: 'plans-test@example.com',
        password: 'Password123!',
      });

    authToken = registerResponse.body.access_token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    try {
      await dataSource.query("DELETE FROM users WHERE email = 'plans-test@example.com'");
      
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
    } catch (error) {
      console.error('Erro no cleanup:', error);
    } finally {
      if (app) {
        await app.close();
      }
      // Aguardar cleanup completo
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  describe('GET /plans', () => {
    it('deve retornar todos os planos disponíveis', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4); // free, basic, pro, enterprise
      
      const planIds = response.body.map(plan => plan.id);
      expect(planIds).toContain('free');
      expect(planIds).toContain('basic');
      expect(planIds).toContain('pro');
      expect(planIds).toContain('enterprise');
    });

    it('deve retornar planos ordenados por preço', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .expect(200);

      const prices = response.body.map(plan => plan.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('deve retornar apenas planos ativos', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .expect(200);

      response.body.forEach(plan => {
        expect(plan.isActive).toBe(true);
      });
    });
  });

  describe('GET /plans/compare', () => {
    it('deve retornar comparação de todos os planos', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/compare')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);

      response.body.forEach(plan => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('features');
      });

      const proPlan = response.body.find(p => p.id === 'pro');
      expect(proPlan.recommended).toBe(true);
    });
  });

  describe('GET /plans/:id', () => {
    it('deve retornar detalhes do plano Free', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/free')
        .expect(200);

      expect(response.body.id).toBe('free');
      expect(response.body.name).toBe('Free');
      expect(response.body.price).toBe(0);
      expect(response.body.features.maxMatchesPerMonth).toBe(10);
      expect(response.body.features.maxTournamentsPerMonth).toBe(1);
      expect(response.body.features.advancedStats).toBe(false);
      expect(response.body.features.knockoutMode).toBe(false);
    });

    it('deve retornar detalhes do plano Basic', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/basic')
        .expect(200);

      expect(response.body.id).toBe('basic');
      expect(response.body.name).toBe('Basic');
      expect(response.body.price).toBe(1990); // R$ 19,90
      expect(response.body.features.maxMatchesPerMonth).toBe(50);
      expect(response.body.features.maxTournamentsPerMonth).toBe(5);
      expect(response.body.features.knockoutMode).toBe(true);
    });

    it('deve retornar detalhes do plano Pro', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/pro')
        .expect(200);

      expect(response.body.id).toBe('pro');
      expect(response.body.name).toBe('Pro');
      expect(response.body.price).toBe(3990); // R$ 39,90
      expect(response.body.features.maxMatchesPerMonth).toBeNull();
      expect(response.body.features.maxTournamentsPerMonth).toBeNull();
      expect(response.body.features.advancedStats).toBe(true);
      expect(response.body.features.teamManagement).toBe(true);
    });

    it('deve retornar detalhes do plano Enterprise', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/enterprise')
        .expect(200);

      expect(response.body.id).toBe('enterprise');
      expect(response.body.name).toBe('Enterprise');
      expect(response.body.price).toBe(0);
      expect(response.body.features.prioritySupport).toBe(true);
      expect(response.body.isEnterprise).toBe(true);
    });

    it('deve retornar 404 para plano inexistente', async () => {
      await request(app.getHttpServer())
        .get('/plans/invalid-plan')
        .expect(404);
    });
  });

  describe('GET /plans/my-plan', () => {
    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .get('/plans/my-plan')
        .expect(401);
    });

    it('deve retornar o plano atual do usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/my-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('features');
      expect(response.body).toHaveProperty('usage');
      expect(response.body.plan).toBe('Free'); // Usuário novo começa com Free
    });
  });

  describe('GET /plans/upgrade-options', () => {
    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .get('/plans/upgrade-options')
        .expect(401);
    });

    it('deve retornar opções de upgrade para usuário Free', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/upgrade-options')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const upgradeIds = response.body.map(plan => plan.id);
      expect(upgradeIds).toContain('basic');
      expect(upgradeIds).toContain('pro');
      expect(upgradeIds).toContain('enterprise');
      expect(upgradeIds).not.toContain('free');
    });
  });

  describe('Validação de Features por Plano', () => {
    it('plano Free deve ter limites corretos', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/free')
        .expect(200);

      const { features } = response.body;
      expect(features.maxMatchesPerMonth).toBe(10);
      expect(features.maxTournamentsPerMonth).toBe(1);
      expect(features.advancedStats).toBe(false);
      expect(features.knockoutMode).toBe(false);
      expect(features.teamManagement).toBe(false);
      expect(features.prioritySupport).toBe(false);
    });

    it('plano Basic deve ter knockoutMode habilitado', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/basic')
        .expect(200);

      expect(response.body.features.knockoutMode).toBe(true);
      expect(response.body.features.advancedStats).toBe(false);
      expect(response.body.features.teamManagement).toBe(false);
    });

    it('plano Pro deve ter todas as features exceto prioritySupport', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/pro')
        .expect(200);

      const { features } = response.body;
      expect(features.maxMatchesPerMonth).toBeNull();
      expect(features.maxTournamentsPerMonth).toBeNull();
      expect(features.advancedStats).toBe(true);
      expect(features.knockoutMode).toBe(true);
      expect(features.teamManagement).toBe(true);
      expect(features.prioritySupport).toBe(false);
    });

    it('plano Enterprise deve ter todas as features', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans/enterprise')
        .expect(200);

      const { features } = response.body;
      expect(features.maxMatchesPerMonth).toBeNull();
      expect(features.maxTournamentsPerMonth).toBeNull();
      expect(features.advancedStats).toBe(true);
      expect(features.knockoutMode).toBe(true);
      expect(features.teamManagement).toBe(true);
      expect(features.prioritySupport).toBe(true);
    });
  });

  describe('Preços dos Planos', () => {
    it('deve ter preços em centavos corretos', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .expect(200);

      const prices = response.body.reduce((acc, plan) => {
        acc[plan.id] = plan.price;
        return acc;
      }, {});

      expect(prices.free).toBe(0);
      expect(prices.basic).toBe(1990); // R$ 19,90
      expect(prices.pro).toBe(3990);   // R$ 39,90
      expect(prices.enterprise).toBe(0); // Sob consulta
    });

    it('todos os planos devem estar em BRL', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .expect(200);

      response.body.forEach(plan => {
        expect(plan.currency).toBe('BRL');
      });
    });
  });
});