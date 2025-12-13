// test/matches.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Matches API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let user2Id: string;
  let user3Id: string;
  let user4Id: string;
  let matchId: string;

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

    // Limpar dados
    await dataSource.query("DELETE FROM users WHERE email LIKE '%match-test%'");

    // Criar 4 usuários para testes
    const user1Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Match User 1',
        email: 'match-test1@example.com',
        password: 'Password123!',
      });

    authToken = user1Response.body.access_token;
    userId = user1Response.body.user.id;

    const user2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Match User 2',
        email: 'match-test2@example.com',
        password: 'Password123!',
      });
    user2Id = user2Response.body.user.id;

    const user3Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Match User 3',
        email: 'match-test3@example.com',
        password: 'Password123!',
      });
    user3Id = user3Response.body.user.id;

    const user4Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Match User 4',
        email: 'match-test4@example.com',
        password: 'Password123!',
      });
    user4Id = user4Response.body.user.id;
  });

  afterAll(async () => {
    try {
      await dataSource.query("DELETE FROM users WHERE email LIKE '%match-test%'");
      
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

  describe('POST /matches', () => {
    it('deve criar uma nova partida com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-123',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: [userId, user2Id, user3Id, user4Id],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.gameId).toBe('game-123');
      expect(response.body.teamFormationMode).toBe('manual');
      expect(response.body.status).toBe('waiting_teams');
      expect(response.body.players).toHaveLength(4);
      matchId = response.body.id;
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .post('/matches')
        .send({
          gameId: 'game-123',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: [userId, user2Id],
        })
        .expect(401);
    });

    it('deve retornar 400 com jogadores inválidos', async () => {
      await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-123',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: ['00000000-0000-0000-0000-000000000000'],
        })
        .expect(400);
    });
  });

  describe('GET /matches', () => {
    it('deve retornar lista de partidas', async () => {
      const response = await request(app.getHttpServer())
        .get('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .get('/matches')
        .expect(401);
    });
  });

  describe('GET /matches/:id', () => {
    it('deve retornar detalhes de uma partida', async () => {
      const response = await request(app.getHttpServer())
        .get(`/matches/${matchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(matchId);
      expect(response.body).toHaveProperty('gameId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('players');
    });

    it('deve retornar 404 para partida inexistente', async () => {
      await request(app.getHttpServer())
        .get('/matches/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /matches/:id/teams (Manual)', () => {
    let manualMatchId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-manual',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: [userId, user2Id, user3Id, user4Id],
        });
      manualMatchId = response.body.id;
    });

    it('deve criar equipes manualmente', async () => {
      const response = await request(app.getHttpServer())
        .post(`/matches/${manualMatchId}/teams`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teams: [
            {
              name: 'Time A',
              players: [userId, user2Id],
            },
            {
              name: 'Time B',
              players: [user3Id, user4Id],
            },
          ],
        })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      
      // Time A
      expect(response.body[0].name).toBe('Time A');
      expect(response.body[0].players).toBeDefined();
      expect(Array.isArray(response.body[0].players)).toBe(true);
      expect(response.body[0].players.length).toBe(2);
      
      // Time B
      expect(response.body[1].name).toBe('Time B');
      expect(response.body[1].players).toBeDefined();
      expect(Array.isArray(response.body[1].players)).toBe(true);
      expect(response.body[1].players.length).toBe(2);
    });

    it('deve rejeitar criação de equipes duplicadas', async () => {
      await request(app.getHttpServer())
        .post(`/matches/${manualMatchId}/teams`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teams: [
            { name: 'Time C', players: [userId] },
            { name: 'Time D', players: [user2Id] },
          ],
        })
        .expect(400);
    });

    it('deve rejeitar jogador duplicado em equipes', async () => {
      const newMatchResponse = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-duplicate',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: [userId, user2Id, user3Id, user4Id],
        });

      await request(app.getHttpServer())
        .post(`/matches/${newMatchResponse.body.id}/teams`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teams: [
            { name: 'Time A', players: [userId, user2Id] },
            { name: 'Time B', players: [user2Id, user3Id] }, // user2Id duplicado
          ],
        })
        .expect(400);
    });

    it('deve rejeitar jogador que não está na partida', async () => {
      const newMatchResponse = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-invalid-player',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: [userId, user2Id],
        });

      await request(app.getHttpServer())
        .post(`/matches/${newMatchResponse.body.id}/teams`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teams: [
            { name: 'Time A', players: [userId] },
            { name: 'Time B', players: [user3Id] }, // user3Id não está na partida
          ],
        })
        .expect(400);
    });
  });

  describe('POST /matches/:id/teams/random (Aleatório)', () => {
    let randomMatchId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-random',
          teamFormationMode: 'random',
          teamCount: 2,
          players: [userId, user2Id, user3Id, user4Id],
        });
      randomMatchId = response.body.id;
    });

    // test/matches.e2e-spec.ts
// Linha 300-315

it('deve criar equipes aleatoriamente', async () => {
    const response = await request(app.getHttpServer())
      .post(`/matches/${randomMatchId}/teams/random`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
  
    console.log('📋 Response status:', response.status);
    console.log('📋 Response body:', JSON.stringify(response.body, null, 2));
  
    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Team 1');
    expect(response.body[1].name).toBe('Team 2');
    
    expect(response.body[0].players).toBeDefined();
    expect(Array.isArray(response.body[0].players)).toBe(true);
    expect(response.body[1].players).toBeDefined();
    expect(Array.isArray(response.body[1].players)).toBe(true);
    
    const allPlayers = [
      ...response.body[0].players,
      ...response.body[1].players,
    ];
    expect(allPlayers).toHaveLength(4);
  });
    it('deve distribuir jogadores igualmente entre equipes', async () => {
      const newMatchResponse = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-random-2',
          teamFormationMode: 'random',
          teamCount: 2,
          players: [userId, user2Id, user3Id, user4Id],
        });

      const response = await request(app.getHttpServer())
        .post(`/matches/${newMatchResponse.body.id}/teams/random`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body[0].players).toHaveLength(2);
      expect(response.body[1].players).toHaveLength(2);
    });
  });

  describe('PATCH /matches/:id', () => {
    it('deve atualizar status da partida', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/matches/${matchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'finished' })
        .expect(200);

      expect(response.body.status).toBe('finished');
    });
  });

  describe('DELETE /matches/:id', () => {
    it('deve remover uma partida', async () => {
      const newMatchResponse = await request(app.getHttpServer())
        .post('/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: 'game-to-delete',
          teamFormationMode: 'manual',
          teamCount: 2,
          players: [userId, user2Id],
        });

      await request(app.getHttpServer())
        .delete(`/matches/${newMatchResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/matches/${newMatchResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});