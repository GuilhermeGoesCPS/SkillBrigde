import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { QueryResult } from 'mysql2';
import { createPool, type Pool, type PoolConnection } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = createPool({
      host: config.get('DB_HOST', 'localhost'),
      port: Number(config.get('DB_PORT', '3306')),
      user: config.get('DB_USER', 'root'),
      password: config.get('DB_PASSWORD', ''),
      database: config.get('DB_NAME', 'skillbridge'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  query<T extends QueryResult>(sql: string, params: unknown[] = []): Promise<T> {
    return this.pool.query<T>(sql, params as never[]).then(([rows]) => rows);
  }

  async transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}