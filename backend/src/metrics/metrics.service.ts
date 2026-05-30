import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { RedisService } from '../redis/redis.service';

interface CounterMetric {
  value: number;
  labels: Record<string, string>;
}

interface HistogramBucket {
  le: number;
  count: number;
}

interface HistogramMetric {
  count: number;
  sum: number;
  buckets: HistogramBucket[];
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly startTime = Date.now();

  private counters = new Map<string, CounterMetric>();
  private histograms = new Map<string, HistogramMetric>();

  constructor(
    @Optional() @Inject(DATABASE_POOL) private readonly pool?: Pool,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    const existing = this.counters.get(key);
    if (existing) {
      existing.value++;
    } else {
      this.counters.set(key, { value: 1, labels });
    }
  }

  observeHistogram(name: string, value: number, _labels: Record<string, string> = {}): void {
    const existing = this.histograms.get(name);
    if (existing) {
      existing.count++;
      existing.sum += value;
      for (const bucket of existing.buckets) {
        if (value <= bucket.le) bucket.count++;
      }
    } else {
      const buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000].map((le) => ({
        le,
        count: value <= le ? 1 : 0,
      }));
      this.histograms.set(name, { count: 1, sum: value, buckets });
    }
  }

  trackRequest(method: string, route: string, statusCode: number, durationMs: number): void {
    this.incrementCounter('http_requests_total', { method, route, status: String(statusCode) });
    this.observeHistogram('http_request_duration_ms', durationMs, { method, route });
    if (statusCode >= 400) {
      this.incrementCounter('http_errors_total', { method, route, status: String(statusCode) });
    }
  }

  trackWsConnection(): void {
    this.incrementCounter('ws_connections_total');
  }

  trackWsDisconnection(): void {
    this.incrementCounter('ws_disconnections_total');
  }

  trackQueueDepth(queue: string, depth: number): void {
    this.observeHistogram('bullmq_queue_depth', depth, { queue });
  }

  trackPipelineStep(step: string, durationMs: number, success: boolean): void {
    this.incrementCounter('pipeline_steps_total', { step, status: success ? 'success' : 'failure' });
    this.observeHistogram('pipeline_step_duration_ms', durationMs, { step });
  }

  trackAiInference(model: string, durationMs: number, success: boolean): void {
    this.incrementCounter('ai_inferences_total', { model, status: success ? 'success' : 'failure' });
    this.observeHistogram('ai_inference_duration_ms', durationMs, { model });
  }

  trackUpload(sizeBytes: number, success: boolean): void {
    this.incrementCounter('uploads_total', { status: success ? 'success' : 'failure' });
    this.observeHistogram('upload_size_bytes', sizeBytes);
  }

  trackAuth(durationMs: number, success: boolean): void {
    this.incrementCounter('auth_requests_total', { status: success ? 'success' : 'failure' });
    this.observeHistogram('auth_duration_ms', durationMs);
  }

  async generatePrometheusMetrics(): Promise<string> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const lines: string[] = [];

    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${uptime}`);

    lines.push('# HELP process_start_time_seconds Start time of the process');
    lines.push('# TYPE process_start_time_seconds gauge');
    lines.push(`process_start_time_seconds ${Math.floor(this.startTime / 1000)}`);

    for (const [_key, metric] of this.counters) {
      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      lines.push(`closet_${_key.split(':')[0]}{${labelStr}} ${metric.value}`);
    }

    for (const [name, hist] of this.histograms) {
      lines.push(`# HELP closet_${name} ${name}`);
      lines.push(`# TYPE closet_${name} histogram`);
      lines.push(`closet_${name}_count ${hist.count}`);
      lines.push(`closet_${name}_sum ${hist.sum}`);
      for (const bucket of hist.buckets) {
        lines.push(`closet_${name}_bucket{le="${bucket.le}"} ${bucket.count}`);
      }
    }

    if (this.pool) {
      const dbResult = await this.pool
        .query(`SELECT count(*)::int as total FROM pg_stat_activity WHERE datname = current_database()`)
        .catch(() => ({ rows: [{ total: 0 }] }));
      lines.push('# HELP closet_db_connections_total Database connections');
      lines.push('# TYPE closet_db_connections_total gauge');
      lines.push(`closet_db_connections_total ${dbResult.rows[0]?.total ?? 0}`);
    }

    if (this.redisService) {
      const redisOk = await this.redisService.healthCheck().catch(() => ({ status: 'down' as const }));
      lines.push('# HELP closet_redis_up Redis service status');
      lines.push('# TYPE closet_redis_up gauge');
      lines.push(`closet_redis_up ${redisOk.status === 'ok' ? 1 : 0}`);

      const client = (this.redisService as unknown as { client?: { info: () => Promise<string> } }).client;
      if (client?.info) {
        const infoStr = await client.info().catch(() => null);
        if (infoStr) {
          const memMatch = infoStr.match(/used_memory:(\d+)/);
          if (memMatch) {
            lines.push('# HELP closet_redis_memory_used_bytes Redis memory usage');
            lines.push('# TYPE closet_redis_memory_used_bytes gauge');
            lines.push(`closet_redis_memory_used_bytes ${parseInt(memMatch[1], 10)}`);
          }
        }
      }
    }

    const memUsage = process.memoryUsage();
    lines.push('# HELP closet_process_memory_bytes Process memory usage');
    lines.push('# TYPE closet_process_memory_bytes gauge');
    lines.push(`closet_process_memory_bytes{type="rss"} ${memUsage.rss}`);
    lines.push(`closet_process_memory_bytes{type="heapTotal"} ${memUsage.heapTotal}`);
    lines.push(`closet_process_memory_bytes{type="heapUsed"} ${memUsage.heapUsed}`);

    return lines.join('\n') + '\n';
  }
}
