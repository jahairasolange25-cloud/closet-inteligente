/**
 * Queue abstraction interface.
 *
 * Decouples the pipeline and other services from BullMQ specifics.
 * When migrating to a different queue backend (e.g., SQS, RabbitMQ),
 * implement this interface and swap the provider in QueueModule.
 */

export interface QueueJobOptions {
  attempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
  priority?: number;
  /** ISO string — delay processing until this time */
  processAt?: string;
}

export interface QueueJobRecord {
  id: string;
  name: string;
  data: unknown;
  attemptsMade: number;
}

export interface DeadLetterEntry {
  jobId: string;
  queueName: string;
  data: unknown;
  failedAt: string;
  reason: string;
  attempts: number;
}

export interface IQueueService {
  /**
   * Enqueue a job. Returns the job ID or empty string on failure.
   */
  addJob(queueName: string, payload: unknown, opts?: QueueJobOptions): Promise<string>;

  /**
   * Register a worker for a queue. Only one worker per queue name.
   */
  processJobs(
    queueName: string,
    handler: (job: QueueJobRecord) => Promise<void>,
  ): void;

  /**
   * Retrieve dead-letter entries for a queue (failed jobs that exhausted retries).
   */
  getDeadLetterEntries(queueName: string, limit?: number): Promise<DeadLetterEntry[]>;
}

export const QUEUE_SERVICE_TOKEN = Symbol('IQueueService');
