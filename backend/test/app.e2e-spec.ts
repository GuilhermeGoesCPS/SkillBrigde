import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { ValidationPipe } from '@nestjs/common';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect(({ body }) => {
        expect(body.nome).toBe('SkillBridge API');
        expect(body.endpoints).toContain('GET /api/vagas');
      });
  });

  it('/api/usuario (GET) requires an access token', () => {
    return request(app.getHttpServer()).get('/api/usuario').expect(401);
  });

  it('/api/cadastro/empresa (POST) validates its body before database access', () => {
    return request(app.getHttpServer()).post('/api/cadastro/empresa').send({}).expect(400);
  });

  it('/api/cadastro/aluno (POST) rejects numeric periods', () => {
    return request(app.getHttpServer())
      .post('/api/cadastro/aluno')
      .send({
        nome: 'Ana Silva',
        email: 'ana@example.com',
        senha: 'senha-forte-123',
        endereco: 'Rua Exemplo, 123',
        ra: '2026000000001',
        periodo: '2',
        cursoId: 1,
        instituicaoId: 1,
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
