import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { DatabaseService } from './database.service.js';
import type { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  it('stores a salted password hash and returns a token on login', async () => {
    let passwordHash: Buffer | undefined;
    const database = {
      transaction: vi.fn(async (work) =>
        work({
          execute: vi.fn(async (sql: string, values: unknown[]) => {
            if (sql.includes('INSERT INTO usuarios')) passwordHash = values[2] as Buffer;
            return [{ insertId: sql.includes('INSERT INTO usuarios') ? 11 : 21 }, []];
          }),
        }),
      ),
      query: vi.fn(async () => [{ id: 11, nome: 'Empresa Teste', senha: passwordHash }]),
    };
    const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
    const service = new AuthService(database as unknown as DatabaseService, jwt as unknown as JwtService);

    const account = await service.registerCompany({
      nome: 'Empresa Teste',
      email: 'empresa@example.com',
      senha: 'senha-forte-123',
      endereco: 'Rua Teste, 10',
      cnpj: '12345678000199',
    });

    expect(account).toEqual({
      id: 11,
      nome: 'Empresa Teste',
      email: 'empresa@example.com',
      tipo: 'empresa',
      perfilId: 21,
    });
    expect(passwordHash).toBeInstanceOf(Buffer);
    expect(passwordHash).toHaveLength(80);
    expect(passwordHash?.toString()).not.toContain('senha-forte-123');

    const session = await service.login('empresa', {
      email: 'empresa@example.com',
      senha: 'senha-forte-123',
    });
    expect(session.accessToken).toBe('signed-token');
    expect(session.expiresIn).toBe(3600);
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: '11', tipo: 'empresa' });
  });

  it('rejects unknown email and incorrect password uniformly', async () => {
    const database = { query: vi.fn().mockResolvedValue([]) };
    const jwt = { signAsync: vi.fn() };
    const service = new AuthService(database as unknown as DatabaseService, jwt as unknown as JwtService);

    await expect(
      service.login('aluno', { email: 'missing@example.com', senha: 'senha-qualquer' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});