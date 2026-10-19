import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthService } from './auth.service.js';
import { DatabaseService } from './database.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getInfo: () => ({ nome: 'SkillBridge API', versao: '1.0.0' }),
            getCursos: () => [{ id: 1, nome: 'Desenvolvimento de Sistemas' }],
          },
        },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET /api', () => {
    it('returns public API information', () => {
      expect(appController.getInfo()).toEqual({ nome: 'SkillBridge API', versao: '1.0.0' });
    });
  });

  describe('GET /api/cursos', () => {
    it('returns courses available to the registration form', () => {
      expect(appController.getCursos()).toEqual([{ id: 1, nome: 'Desenvolvimento de Sistemas' }]);
    });
  });
});

describe('AppService filters', () => {
  const query = vi.fn();
  let appService: AppService;

  beforeEach(() => {
    query.mockReset().mockResolvedValue([]);
    appService = new AppService({ query } as unknown as DatabaseService);
  });

  it('rejects malformed tag IDs without querying the database', async () => {
    await expect(appService.getVagas('1,abc')).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('requires tags when searching students', async () => {
    await expect(appService.getAlunos()).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns student IDs for a company-owned vacancy', async () => {
    query
      .mockResolvedValueOnce([{ id: 5 }])
      .mockResolvedValueOnce([{ id: 12, empresa: 5 }])
      .mockResolvedValueOnce([{ alunoId: 3 }, { alunoId: 9 }]);

    await expect(appService.getApplications({ userId: 22, tipo: 'empresa' }, 12)).resolves.toEqual({
      vagaId: 12,
      alunosIds: [3, 9],
    });
  });
});
