import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

interface TraceableRequest extends Request {
  traceId?: string;
  spanId?: string;
}

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TracingMiddleware.name);

  use(req: TraceableRequest, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
    const spanId = randomUUID().substring(0, 16);

    req.traceId = traceId;
    req.spanId = spanId;

    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Span-Id', spanId);

    const startTime = Date.now();
    const originalEnd = res.end.bind(res);

    res.end = ((...args: unknown[]) => {
      const duration = Date.now() - startTime;
      if (res.statusCode >= 500) {
        this.logger.warn(
          `[${traceId}:${spanId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
        );
      }
      return originalEnd(...args as [never]);
    }) as typeof res.end;

    next();
  }
}
