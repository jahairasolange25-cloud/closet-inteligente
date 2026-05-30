import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';

export interface QueueJob {
  id: string;
  name: string;
  data: any;
}

export interface QueueMetrics {
  queueName: string;
  completed: number;
  failed: number;
  active: number;
  waiting: number;
}

type RedisConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  lazyConnect?: boolean;
};

const METRICS_INTERVAL_MS = 30000;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly metricsCounters = new Map<string, { completed: number; failed: number; active: number; waiting: number }>();
  private readonly deadLetterQueues = new Map<string, Queue>();
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.metricsInterval = setInterval(() => {
      this.logMetrics();
    }, METRICS_INTERVAL_MS);
  }

  private connection(): RedisConnectionOptions {
    const opts: RedisConnectionOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      lazyConnect: true,
    };
    if (process.env.REDIS_PASSWORD) {
      opts.password = process.env.REDIS_PASSWORD;
    }
    return opts;
  }

  async addJob(queueName: string, payload: any, options?: { attempts?: number }): Promise<string> {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, {
        connection: this.connection(),
        defaultJobOptions: {
          attempts: options?.attempts ?? 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      });
      this.queues.set(queueName, queue);
      this.metricsCounters.set(queueName, { completed: 0, failed: 0, active: 0, waiting: 0 });
    }

    try {
      const job = await queue.add(queueName, payload);
      this.logger.debug(`[Queue:${queueName}] Job ${job.id} enqueued`);
      return job.id ?? '';
    } catch (err: any) {
      this.logger.error(`[Queue:${queueName}] Failed to enqueue job: ${err.message}`);
      return '';
    }
  }

  processJobs(queueName: string, handler: (job: QueueJob) => Promise<void>): void {
    if (this.workers.has(queueName)) return;

    const worker = new Worker(
      queueName,
      async (job: Job) => handler({ id: job.id ?? '', name: job.name, data: job.data }),
      {
        connection: this.connection(),
        concurrency: 2,
      },
    );

    const counter = this.metricsCounters.get(queueName) ?? { completed: 0, failed: 0, active: 0, waiting: 0 };
    this.metricsCounters.set(queueName, counter);

    worker.on('error', (err) => {
      this.logger.warn(`[Queue:${queueName}] Worker connection error: ${err.message}`);
    });

    worker.on('failed', (job, err) => {
      counter.failed++;
      const attemptsMade = job?.attemptsMade ?? 0;
      const maxAttempts = job?.opts?.attempts ?? 3;
      this.logger.error(
        `[Queue:${queueName}] Job ${job?.id} failed (attempt ${attemptsMade}/${maxAttempts}): ${err.message}`,
      );

      if (job && attemptsMade >= maxAttempts) {
        this.moveToDeadLetterQueue(queueName, job, err.message).catch((dlqErr) => {
          this.logger.error(`[Queue:${queueName}] Failed to move job to DLQ: ${(dlqErr as Error).message}`);
        });
      }
    });

    worker.on('completed', (job) => {
      counter.completed++;
      this.logger.debug(`[Queue:${queueName}] Job ${job.id} completed`);
    });

    worker.on('active', () => {
      counter.active++;
    });

    this.workers.set(queueName, worker);
    this.logger.log(`[Queue] Worker registered for queue "${queueName}"`);
  }

  private async moveToDeadLetterQueue(queueName: string, job: Job, errorMessage: string): Promise<void> {
    const dlqName = `${queueName}:dead`;
    let dlq = this.deadLetterQueues.get(dlqName);
    if (!dlq) {
      dlq = new Queue(dlqName, {
        connection: this.connection(),
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 100 },
        },
      });
      this.deadLetterQueues.set(dlqName, dlq);
    }

    await dlq.add(`${queueName}:dead`, {
      originalJobId: job.id,
      originalQueue: queueName,
      data: job.data,
      failedAt: new Date().toISOString(),
      error: errorMessage,
      attemptsMade: job.attemptsMade,
    });

    this.logger.warn(`[Queue:${queueName}] Job ${job.id} moved to DLQ "${dlqName}"`);
  }

  getMetrics(queueName?: string): QueueMetrics[] {
    const metrics: QueueMetrics[] = [];
    for (const [name, counter] of this.metricsCounters) {
      if (queueName && name !== queueName) continue;
      metrics.push({
        queueName: name,
        ...counter,
      });
    }
    return metrics;
  }

  private logMetrics(): void {
    for (const [name, counter] of this.metricsCounters) {
      this.logger.debug(`[Queue:${name}] Metrics — completed: ${counter.completed}, failed: ${counter.failed}, active: ${counter.active}, waiting: ${counter.waiting}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    const closeOps: Promise<void>[] = [];

    for (const [name, worker] of this.workers) {
      closeOps.push(
        worker.close(true).then(() => this.logger.log(`[Queue] Worker "${name}" closed`)).catch(() => {}),
      );
    }

    for (const [name, queue] of this.queues) {
      closeOps.push(
        queue.drain().then(() => queue.close()).then(() => this.logger.log(`[Queue] Queue "${name}" drained and closed`)).catch(() => {}),
      );
    }

    for (const [name, dlq] of this.deadLetterQueues) {
      closeOps.push(
        dlq.close().then(() => this.logger.log(`[Queue] DLQ "${name}" closed`)).catch(() => {}),
      );
    }

    await Promise.allSettled(closeOps);
    this.logger.log('[Queue] All workers and queues shut down');
  }
}
