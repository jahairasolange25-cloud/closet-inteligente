import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { DATABASE_POOL } from './database.module';

const SLOW_QUERY_THRESHOLD_MS = 100;
const STATS_INTERVAL_MS = 60000;

@Injectable()
export class DatabaseMonitor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseMonitor.name);
  private statsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  onModuleInit(): void {
    const originalQuery = this.pool.query.bind(this.pool) as (
      ...args: any[]
    ) => Promise<QueryResult>;

    const self = this;
    (this.pool as any).query = function monitoredQuery(...args: any[]): Promise<QueryResult> {
      const start = Date.now();
      const promise = originalQuery(...args);
      promise.then(() => {
        const duration = Date.now() - start;
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          self.logger.warn(`Slow query (${duration}ms): ${args[0]?.substring?.(0, 200) ?? 'unknown'}`);
        }
      }).catch(() => {});
      return promise;
    };

    this.statsInterval = setInterval(() => {
      this.logPoolStats();
    }, STATS_INTERVAL_MS);

    this.pool.on('error', (err) => {
      this.logger.error(`Pool error: ${err.message}`);
    });

    this.pool.on('connect', () => {
      this.logger.debug('New client acquired from pool');
    });

    this.pool.on('remove', () => {
      this.logger.debug('Client removed from pool');
    });

    this.logger.log('Database monitor initialized');
  }

  onModuleDestroy(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private logPoolStats(): void {
    try {
      const total = this.pool.totalCount;
      const idle = this.pool.idleCount;
      const waiting = this.pool.waitingCount;
      const active = total - idle;

      this.logger.log(`Pool stats — total: ${total}, active: ${active}, idle: ${idle}, waiting: ${waiting}`);
    } catch (err) {
      this.logger.warn(`Failed to log pool stats: ${(err as Error).message}`);
    }
  }

  getPoolHealth(): { total: number; active: number; idle: number; waiting: number } {
    return {
      total: this.pool.totalCount,
      active: this.pool.totalCount - this.pool.idleCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}
