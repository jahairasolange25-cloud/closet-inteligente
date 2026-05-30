import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';

interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTime: [number, number];
  endTime?: [number, number];
  attributes: Record<string, string | number | boolean>;
  status?: { code: number; message?: string };
}

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TracingInterceptor.name);
  private readonly spans: Span[] = [];
  private readonly maxSpans = 10000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    const traceId = (request.headers['x-trace-id'] as string) || randomUUID().replace(/-/g, '').slice(0, 16);
    const spanId = randomUUID().replace(/-/g, '').slice(0, 16);
    const parentSpanId = request.headers['x-parent-span-id'] as string;

    const span: Span = {
      traceId,
      spanId,
      parentSpanId,
      name: `${request.method} ${request.route?.path || request.path}`,
      kind: 'SERVER',
      startTime: process.hrtime(),
      attributes: {
        'http.method': request.method,
        'http.url': request.originalUrl || request.url,
        'http.host': request.headers.host || '',
        'component': 'nestjs',
      },
    };

    request.headers['x-trace-id'] = traceId;
    request.headers['x-span-id'] = spanId;
    response.setHeader('x-trace-id', traceId);
    response.setHeader('x-span-id', spanId);

    return next.handle().pipe(
      tap({
        next: () => {
          span.endTime = process.hrtime(span.startTime);
          span.attributes['http.status_code'] = response.statusCode;
          span.status = response.statusCode < 500 ? { code: 1 } : { code: 2, message: 'Error' };
          this.recordSpan(span);
        },
        error: (error: any) => {
          span.endTime = process.hrtime(span.startTime);
          span.attributes['http.status_code'] = response.statusCode || 500;
          span.attributes['error.message'] = error.message ?? 'Unknown error';
          span.status = { code: 2, message: error.message };
          this.recordSpan(span);
        },
      }),
    );
  }

  private recordSpan(span: Span): void {
    if (this.spans.length >= this.maxSpans) {
      this.spans.splice(0, Math.floor(this.maxSpans / 2));
    }
    this.spans.push(span);

    this.logger.debug({
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      duration_ns: span.endTime ? span.endTime[0] * 1e9 + span.endTime[1] : 0,
      attributes: span.attributes,
    });
  }

  getSpans(): Span[] {
    return this.spans;
  }
}
