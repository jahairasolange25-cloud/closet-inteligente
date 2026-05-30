import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const id = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    req.headers[CORRELATION_ID_HEADER] = id;
    res.setHeader(CORRELATION_ID_HEADER, id);

    const originalEnd = res.end.bind(res);
    res.end = (...args: any[]) => {
      const duration = Date.now() - startTime;
      const userId = (req as any).user?.id ?? undefined;

      const logEntry: Record<string, any> = {
        correlationId: id,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      };
      if (userId) {
        logEntry.userId = userId;
      }

      this.logger.log(JSON.stringify(logEntry));
      return originalEnd(...args);
    };

    next();
  }
}
