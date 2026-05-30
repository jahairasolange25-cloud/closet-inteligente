import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../../redis/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { logSecurityEvent, createSecurityEvent } from '../utils/security-logger';

const DEFAULT_LIMIT = parseInt(process.env.RATE_LIMIT_DEFAULT_LIMIT || '60', 10);
const DEFAULT_TTL = parseInt(process.env.RATE_LIMIT_DEFAULT_TTL || '60000', 10);

const LOGIN_ENDPOINT = '/api/v1/auth/login';
const BRUTE_FORCE_THRESHOLD = 5;
const BRUTE_FORCE_BACKOFF_BASE_MS = 1000;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly degraded = false;

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    if (request.path === '/health') {
      return true;
    }

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const limit = options?.limit ?? DEFAULT_LIMIT;
    const ttl = options?.ttl ?? DEFAULT_TTL;

    const userId = (request as any).user?.id;
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim();
    const clientIp = ip || request.ip || 'unknown';

    const identifier = userId || clientIp;
    const route = request.route?.path || request.path;
    const key = `rate_limit:${identifier}:${route}`;

    const isLogin = request.path === LOGIN_ENDPOINT || request.originalUrl?.startsWith(LOGIN_ENDPOINT);

    try {
      let effectiveLimit = limit;
      let effectiveTtl = ttl;

      if (isLogin) {
        const failureKey = `brute:${clientIp}`;
        const failures = await this.redisService.get<number>(failureKey) ?? 0;

        if (failures >= BRUTE_FORCE_THRESHOLD) {
          const backoffMs = Math.min(
            BRUTE_FORCE_BACKOFF_BASE_MS * Math.pow(2, failures - BRUTE_FORCE_THRESHOLD),
            300000,
          );
          effectiveLimit = Math.max(1, Math.floor(limit / (failures - BRUTE_FORCE_THRESHOLD + 2)));
          effectiveTtl = Math.max(ttl, backoffMs);

          if (failures >= BRUTE_FORCE_THRESHOLD * 2) {
            logSecurityEvent(createSecurityEvent('BRUTE_FORCE_DETECTED', {
              userId: userId ?? undefined,
              ip: clientIp,
              path: request.path,
              method: request.method,
              userAgent: (request.headers['user-agent'] as string) ?? undefined,
              metadata: { consecutiveFailures: failures, backoffMs },
            }));
          }
        }
      }

      const count = await this.redisService.increment(key, Math.ceil(effectiveTtl / 1000));

      const remaining = Math.max(0, effectiveLimit - count);
      const resetTime = Date.now() + effectiveTtl;

      const response = context.switchToHttp().getResponse();
      response.header('X-RateLimit-Limit', effectiveLimit.toString());
      response.header('X-RateLimit-Remaining', remaining.toString());
      response.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

      if (count > effectiveLimit) {
        if (count > effectiveLimit + 10) {
          logSecurityEvent(createSecurityEvent('RATE_LIMIT_EXCEEDED', {
            userId: userId ?? undefined,
            ip: clientIp,
            path: request.path,
            method: request.method,
            metadata: { exceededBy: count - effectiveLimit, isLogin },
          }));
        }

        throw new HttpException(
          { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'TOO_MANY_REQUESTS' },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.warn(`Rate limit Redis error, allowing request: ${(error as Error).message}`);
      return true;
    }
  }
}
