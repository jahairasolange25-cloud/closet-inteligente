import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor, Optional } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.module';
import { RedisService } from '../../redis/redis.service';
import { logSecurityEvent, createSecurityEvent } from '../utils/security-logger';
import * as fs from 'fs';
import * as path from 'path';

const SENSITIVE_FIELDS = new Set([
  'password', 'password_hash', 'newpassword', 'new_password', 'oldpassword', 'old_password',
  'confirmpassword', 'confirm_password', 'currentpassword', 'current_password',
  'token', 'access_token', 'accesstoken', 'refresh_token', 'refreshtoken',
  'secret', 'api_key', 'apikey', 'private_key', 'privatekey',
  'authorization', 'x-api-key', 'cookie', 'ssn', 'credit_card', 'cvv',
]);
const MAX_BODY_SIZE = 10 * 1024;
const EXCLUDED_PATHS = new Set(['/health']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);
  private readonly logDir: string;
  private canWriteToFile = false;

  constructor(
    @Optional() private readonly redisService?: RedisService,
    @Optional() @Inject(DATABASE_POOL) private readonly pool?: Pool,
  ) {
    this.logDir = path.resolve(process.cwd(), 'logs');
    if (fs.existsSync(this.logDir)) {
      this.canWriteToFile = true;
    } else {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
        this.canWriteToFile = true;
      } catch {
        this.logger.warn('Cannot create logs directory, audit log file writing disabled');
      }
    }
    this.ensureAuditLogTable();
  }

  private async ensureAuditLogTable(): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID,
          method VARCHAR(10) NOT NULL,
          url TEXT NOT NULL,
          status INTEGER NOT NULL,
          execution_ms INTEGER,
          ip INET,
          user_agent TEXT,
          action VARCHAR(100),
          entity_type VARCHAR(100),
          entity_id UUID,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    } catch (err) {
      this.logger.warn(`Could not ensure audit_log table: ${(err as Error).message}`);
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request: Request = context.switchToHttp().getRequest();

    if (EXCLUDED_PATHS.has(request.path)) {
      return next.handle();
    }

    const userId = (request as any).user?.id ?? null;
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
    const userAgent = (request.headers['user-agent'] ?? null) as string | null;

    const body = this.sanitizeBody(request.body);
    const action = `${request.method} ${request.route?.path || request.path}`;
    const entityType = this.extractEntityType(request.path);

    return next.handle().pipe(
      tap({
        next: (responseBody: any) => {
          const executionMs = Date.now() - startTime;
          const response: Response = context.switchToHttp().getResponse();

          const entry = {
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.originalUrl || request.url,
            status: response.statusCode,
            execution_ms: executionMs,
            user_id: userId,
            ip,
            user_agent: userAgent,
            body,
            action,
            entity_type: entityType,
            response: this.truncate(this.sanitizeBody(responseBody), 1000),
          };

          this.writeLog(entry);
        },
        error: (error: any) => {
          const executionMs = Date.now() - startTime;
          const response: Response = context.switchToHttp().getResponse();

          const entry = {
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.originalUrl || request.url,
            status: response.statusCode || 500,
            execution_ms: executionMs,
            user_id: userId,
            ip,
            user_agent: userAgent,
            body,
            action,
            entity_type: entityType,
            response: { error: error.message ?? 'Unknown error' },
          };

          this.writeLog(entry);

          if (response.statusCode === 401 || response.statusCode === 403) {
            logSecurityEvent(createSecurityEvent('UNAUTHORIZED_ACCESS', {
              userId,
              ip,
              path: request.path,
              method: request.method,
              userAgent: userAgent ?? undefined,
              metadata: { statusCode: response.statusCode },
            }));
          }
        },
      }),
    );
  }

  private extractEntityType(url: string): string | null {
    const parts = url.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'api' && parts[i + 1] === 'v1' && parts[i + 2]) {
        return parts[i + 2];
      }
    }
    return null;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    if (Buffer.isBuffer(body)) return { _type: 'Buffer', size: body.length };

    const sanitized: any = Array.isArray(body) ? [] : {};

    for (const [key, value] of Object.entries(body)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeBody(value);
      } else {
        sanitized[key] = this.truncate(value, MAX_BODY_SIZE);
      }
    }

    return sanitized;
  }

  private truncate(value: any, maxLength: number): any {
    if (typeof value === 'string' && value.length > maxLength) {
      return value.slice(0, maxLength) + '...';
    }
    return value;
  }

  private writeLog(entry: Record<string, any>): void {
    const line = JSON.stringify(entry) + '\n';

    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.logDir, `audit-${dateStr}.jsonl`);

    if (this.canWriteToFile) {
      try {
        fs.appendFileSync(filePath, line, 'utf-8');
      } catch (err) {
        this.logger.warn(`Failed to write audit log file: ${(err as Error).message}`);
        this.canWriteToFile = false;
      }
    }

    if (this.redisService) {
      try {
        this.redisService.rpush('audit:log', line.trim()).catch(() => {});
        this.redisService.ltrim('audit:log', -1000, -1).catch(() => {});
      } catch {
        // graceful degradation
      }
    }

    if (this.pool) {
      this.pool.query(
        `INSERT INTO audit_log (user_id, method, url, status, execution_ms, ip, user_agent, action, entity_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::inet, $7, $8, $9, $10::jsonb)`,
        [
          entry.user_id ?? null,
          entry.method,
          entry.url,
          entry.status,
          entry.execution_ms ?? null,
          entry.ip !== 'unknown' ? entry.ip : null,
          entry.user_agent ?? null,
          (entry.action ?? `${entry.method} ${entry.url}`) as string,
          entry.entity_type ?? null,
          JSON.stringify({ response_summary: entry.response ? this.truncate(JSON.stringify(entry.response), 500) : null }),
        ],
      ).catch((err: Error) => {
        this.logger.warn(`Failed to persist audit log to DB: ${err.message}`);
      });
    }
  }
}
