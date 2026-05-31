import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { RedisService } from '../redis/redis.service';

@Controller()
export class HealthController {
  constructor(
    @Optional() @Inject(DATABASE_POOL) private readonly pool?: Pool,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health/live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString(), process: 'alive' };
  }

  @Get('health/ready')
  async readiness() {
    const [db, redis, ai] = await Promise.all([
      this.checkDatabase(),
      this.redisService ? this.redisService.healthCheck() : Promise.resolve({ status: 'unknown' as const, latencyMs: null }),
      this.checkAiService(),
    ]);

    const checks = { database: db, redis, ai_service: ai };
    const allOk = Object.values(checks).every((c) => c.status === 'ok');
    const overall = allOk ? 'ok' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('health/detailed')
  async healthDetailed() {
    const [db, redis] = await Promise.all([
      this.checkDatabase(),
      this.redisService ? this.redisService.healthCheck() : Promise.resolve({ status: 'unknown' as const, latencyMs: null }),
    ]);

    const overall = db.status === 'ok' && redis.status === 'ok' ? 'ok' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      checks: {
        database: db,
        redis,
        queue: { status: 'ok', note: 'BullMQ backed by Redis' },
      },
    };
  }

  private async checkDatabase(): Promise<{ status: 'ok' | 'degraded'; latencyMs: number | null; error?: string }> {
    if (!this.pool) return { status: 'degraded', latencyMs: null, error: 'No pool' };

    const t0 = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { status: 'ok', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { status: 'degraded', latencyMs: null, error: err?.message?.slice(0, 200) ?? 'Unknown error' };
    }
  }

  private async checkAiService(): Promise<{ status: 'ok' | 'degraded'; latencyMs: number | null }> {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:5100';
    const t0 = Date.now();
    try {
      const response = await fetch(`${aiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        return { status: 'ok', latencyMs: Date.now() - t0 };
      }
      return { status: 'degraded', latencyMs: Date.now() - t0 };
    } catch {
      return { status: 'degraded', latencyMs: null };
    }
  }
}
