import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import type { AccountType } from './auth.dto.js';

describe('AuthGuard', () => {
  const handler = () => undefined;
  const controller = class {};
  let request: { headers: Record<string, string>; user?: unknown };
  let getMetadata: ReturnType<typeof vi.fn>;
  let verifyAsync: ReturnType<typeof vi.fn>;
  let guard: AuthGuard;

  function context() {
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
  }

  beforeEach(() => {
    request = { headers: {} };
    getMetadata = vi.fn();
    verifyAsync = vi.fn();
    guard = new AuthGuard(
      { getAllAndOverride: getMetadata } as unknown as Reflector,
      { verifyAsync } as never,
    );
  });

  it('allows public routes without a token', async () => {
    getMetadata.mockReturnValueOnce(true);
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects protected requests without a bearer token', async () => {
    getMetadata.mockReturnValueOnce(false);
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a valid token when the account role is not allowed', async () => {
    getMetadata
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['empresa'] satisfies AccountType[]);
    request.headers.authorization = 'Bearer valid-token';
    verifyAsync.mockResolvedValue({ sub: '24', tipo: 'aluno' });

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ForbiddenException);
    expect(request.user).toEqual({ userId: 24, tipo: 'aluno' });
  });

  it('attaches the authenticated identity when the role is allowed', async () => {
    getMetadata
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['aluno'] satisfies AccountType[]);
    request.headers.authorization = 'Bearer valid-token';
    verifyAsync.mockResolvedValue({ sub: '24', tipo: 'aluno' });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 24, tipo: 'aluno' });
  });

  it('rejects invalid and expired tokens', async () => {
    getMetadata.mockReturnValueOnce(false);
    request.headers.authorization = 'Bearer expired-token';
    verifyAsync.mockRejectedValue(new Error('expired'));

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});