/**
 * Lightweight client-side metrics layer.
 *
 * No external SaaS. Metrics accumulate in memory and are logged periodically.
 * Replace the flush handler with a real observability endpoint when ready.
 */

interface MetricEvent {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes';
  tags?: Record<string, string>;
  timestamp: number;
}

const buffer: MetricEvent[] = [];
const MAX_BUFFER = 200;

function record(name: string, value: number, unit: MetricEvent['unit'], tags?: Record<string, string>) {
  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push({ name, value, unit, tags, timestamp: Date.now() });
}

let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer() {
  if (typeof window === 'undefined' || flushTimer) return;
  flushTimer = setInterval(() => {
    if (buffer.length === 0) return;
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Metrics]', buffer.splice(0, buffer.length));
    } else {
      // Production: POST to /api/v1/metrics or discard
      buffer.splice(0, buffer.length);
    }
  }, 30_000);
}

if (typeof window !== 'undefined') startFlushTimer();

export const metrics = {
  /** Record an arbitrary metric */
  record(name: string, value: number, unit: MetricEvent['unit'], tags?: Record<string, string>) {
    record(name, value, unit, tags);
  },
  /** Track API response time */
  apiLatency(endpoint: string, ms: number) {
    record('api.latency', ms, 'ms', { endpoint });
  },
  /** Track WebSocket reconnect attempts */
  wsReconnect(attempt: number) {
    record('ws.reconnect', attempt, 'count');
  },
  /** Track upload failures */
  uploadFailure(reason: string) {
    record('upload.failure', 1, 'count', { reason });
  },
  /** Track auth refresh failures */
  authRefreshFailure() {
    record('auth.refresh.failure', 1, 'count');
  },
  /** Track R3F render crashes */
  renderCrash(context: string) {
    record('render.crash', 1, 'count', { context });
  },
  /** Returns a snapshot of buffered events (dev/test only) */
  snapshot(): readonly MetricEvent[] {
    return [...buffer];
  },
};
