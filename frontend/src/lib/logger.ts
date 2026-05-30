/**
 * Structured frontend logger.
 *
 * - Dev: verbose with context objects
 * - Production: silent below WARN; WARN/ERROR emit JSON to console for log aggregation
 * - Correlation ID is propagated per-request via a context variable
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  correlationId?: string;
  data?: unknown;
  timestamp: string;
}

const IS_DEV = process.env.NODE_ENV === 'development';

let _correlationId: string | null = null;

export function setCorrelationId(id: string | null) {
  _correlationId = id;
}

export function getCorrelationId(): string | null {
  return _correlationId;
}

function emit(level: LogLevel, message: string, context?: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    context,
    correlationId: _correlationId ?? undefined,
    data,
    timestamp: new Date().toISOString(),
  };

  if (IS_DEV) {
    const prefix = `[${entry.level.toUpperCase()}]${context ? ` [${context}]` : ''}`;
    if (level === 'debug' || level === 'info') {
      console.log(prefix, message, data ?? '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data ?? '');
    } else {
      console.error(prefix, message, data ?? '');
    }
    return;
  }

  // Production: only emit WARN+ as structured JSON
  if (level === 'warn' || level === 'error') {
    console[level](JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, context?: string, data?: unknown) => emit('debug', message, context, data),
  info: (message: string, context?: string, data?: unknown) => emit('info', message, context, data),
  warn: (message: string, context?: string, data?: unknown) => emit('warn', message, context, data),
  error: (message: string, context?: string, data?: unknown) => emit('error', message, context, data),
};

/**
 * Wraps an async function with timing + correlation ID logging.
 */
export async function withRequestLogging<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  logger.debug(`→ ${label}`, 'Request');
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - start);
    logger.debug(`← ${label} (${ms}ms)`, 'Request');
    return result;
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    logger.error(`✗ ${label} failed (${ms}ms)`, 'Request', err);
    throw err;
  }
}
