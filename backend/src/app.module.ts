import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { randomBytes } from 'node:crypto';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseService } from './database.service.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
          throw new Error('JWT_SECRET com pelo menos 32 caracteres precisa estar configurado em produção.');
        }
        return { secret: secret ?? randomBytes(32).toString('hex'), signOptions: { expiresIn: '1h' } };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    DatabaseService,
    AuthGuard,
    { provide: APP_GUARD, useExisting: AuthGuard },
  ],
})
export class AppModule {}
