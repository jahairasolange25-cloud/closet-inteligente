import { Controller, Get, Inject, Optional, Res } from '@nestjs/common';
import { Pool } from 'pg';
import { Response } from 'express';
import { DATABASE_POOL } from '../database/database.module';
import { RedisService } from '../redis/redis.service';

@Controller()
export class MetricsController {
  private startTime = Date.now();
  private requestCounters = new Map<string, number>();
  private requestDurations: number[] = [];
  private activeConnections = 0;

  constructor(
    @Optional() @Inject(DATABASE_POOL) private readonly pool?: Pool,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  @Get('metrics')
  async metrics(@Res() res: Response): Promise<void> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const lines: string[] = [];

    // Uptime
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${uptime}`);

    // Request counts
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    for (const [key, count] of this.requestCounters) {
      lines.push(`http_requests_total{${key}} ${count}`);
    }

    // Active connections
    lines.push('# HELP http_active_connections Active HTTP connections');
    lines.push('# TYPE http_active_connections gauge');
    lines.push(`http_active_connections ${this.activeConnections}`);

    // Request duration histogram
    lines.push('# HELP http_request_duration_ms Request duration in milliseconds');
    lines.push('# TYPE http_request_duration_ms histogram');
    lines.push(`http_request_duration_ms_count ${this.requestDurations.length}`);
    const sum = this.requestDurations.reduce((a, b) => a + b, 0);
    lines.push(`http_request_duration_ms_sum ${sum}`);

    // DB pool stats
    if (this.pool) {
      const dbResult = await this.pool.query(
        `SELECT count(*)::int as total FROM pg_stat_activity WHERE datname = current_database()`,
      ).catch(() => ({ rows: [{ total: 0 }] }));
      lines.push('# HELP db_connections_total Current database connections');
      lines.push('# TYPE db_connections_total gauge');
      lines.push(`db_connections_total ${dbResult.rows[0]?.total ?? 0}`);
    }

    // Redis health
    if (this.redisService) {
      const redisOk = await this.redisService.healthCheck().catch(() => ({ status: 'down' as const }));
      lines.push('# HELP redis_up Redis service status');
      lines.push('# TYPE redis_up gauge');
      lines.push(`redis_up ${redisOk.status === 'ok' ? 1 : 0}`);
    }

    // AI queue metrics
    lines.push('# HELP bullmq_queue_size BullMQ queue size');
    lines.push('# TYPE bullmq_queue_size gauge');
    lines.push(`bullmq_queue_size{queue="pipeline"} 0`);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(lines.join('\n') + '\n');
  }

  incrementRequestCounter(method: string, route: string, status: number): void {
    const key = `method="${method}",route="${route}",status="${status}"`;
    this.requestCounters.set(key, (this.requestCounters.get(key) ?? 0) + 1);
  }

  recordRequestDuration(durationMs: number): void {
    this.requestDurations.push(durationMs);
    if (this.requestDurations.length > 10000) {
      this.requestDurations.splice(0, 1000);
    }
  }

  incrementActiveConnections(): void {
    this.activeConnections++;
  }

  decrementActiveConnections(): void {
    if (this.activeConnections > 0) this.activeConnections--;
  }
}
