import { Logger, Module } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

async function createPoolWithRetry(): Promise<Pool> {
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
    family: 4,
  } as PoolConfig & { family?: number });

  pool.on('error', (err) => {
    logger.error(`Unexpected DB pool error: ${err.message}`);
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.log(`PostgreSQL connected (attempt ${attempt})`);
      return pool;
    } catch (err: any) {
      logger.warn(`DB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) {
        logger.error('All DB connection attempts exhausted — starting without verified DB connection');
        return pool;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  return pool;
}

const databasePoolProvider = {
  provide: DATABASE_POOL,
  useFactory: (): Promise<Pool> => createPoolWithRetry(),
};

@Module({
  providers: [databasePoolProvider],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
