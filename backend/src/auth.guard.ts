import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AccountType } from './auth.dto.js';
import { AuthenticatedUser, IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorator.js';

interface AccessTokenPayload {
  sub: string;
  tipo: AccountType;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const [scheme, token, ...extra] = request.headers.authorization?.trim().split(/\s+/) ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
      throw new UnauthorizedException('Token Bearer obrigatório.');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const userId = Number(payload.sub);
    if (
      !Number.isSafeInteger(userId) ||
      userId < 1 ||
      !['aluno', 'empresa', 'instituicao'].includes(payload.tipo)
    ) {
      throw new UnauthorizedException('Token inválido.');
    }

    request.user = { userId, tipo: payload.tipo };
    const roles = this.reflector.getAllAndOverride<AccountType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(payload.tipo)) {
      throw new ForbiddenException('Seu tipo de conta não tem acesso a este recurso.');
    }
    return true;
  }
}