import { Logger, Module } from '@nestjs/common';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

let poolInstance: Pool | null = null;

function createPool(): Pool {
  const logger = new Logger('DatabaseModule');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'closet',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'closet',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'closet_secret',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    logger.error(`Unexpected DB pool error: ${err.message}`);
  });

  pool.connect().then((client) => {
    client.release();
    logger.log('PostgreSQL connected');
  }).catch((err) => {
    logger.warn(`Initial DB connection failed: ${err.message}`);
  });

  poolInstance = pool;
  return pool;
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}

const databasePoolProvider = {
  provide: DATABASE_POOL,
  useFactory: (): Pool => createPool(),
};

@Module({
  providers: [databasePoolProvider],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
