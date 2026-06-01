import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const DEFAULT_TTL = 300;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private connected = false;
  private readonly getOrSetLocks = new Map<string, Promise<any>>();
  private readonly prefix: string;

  constructor() {
    this.prefix = process.env.REDIS_KEY_PREFIX || 'closet:';
  }

  async onModuleInit(): Promise<void> {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: this.prefix,
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      await this.client.connect();
      this.connected = true;
      this.logger.log('Connected to Redis');
    } catch (error) {
      this.connected = false;
      this.logger.warn(`Redis connection failed, caching disabled: ${(error as Error).message}`);
      this.client = new Redis({ lazyConnect: true, enableOfflineQueue: false });
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  private checkConnection(): boolean {
    if (!this.connected) {
      this.logger.warn('Redis not connected, operation skipped');
      return false;
    }
    return true;
  }

  async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    if (!this.checkConnection()) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.warn(`Redis set failed for key ${key}: ${(error as Error).message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.checkConnection()) return null;

    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn(`Redis get failed for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.checkConnection()) return;

    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis delete failed for key ${key}: ${(error as Error).message}`);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.checkConnection()) return;

    try {
      let cursor = '0';
      do {
        const result = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(`Redis deletePattern failed for ${pattern}: ${(error as Error).message}`);
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
    if (!this.checkConnection()) {
      return factory();
    }

    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const lockKey = `lock:${key}`;
    const existing = this.getOrSetLocks.get(lockKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      try {
        const doubleCheck = await this.get<T>(key);
        if (doubleCheck !== null) return doubleCheck;

        const value = await factory();
        await this.set(key, value, ttl);
        return value;
      } finally {
        this.getOrSetLocks.delete(lockKey);
      }
    })();

    this.getOrSetLocks.set(lockKey, promise);
    return promise;
  }

  async increment(key: string, ttl: number): Promise<number> {
    if (!this.checkConnection()) return 0;

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec() as [[Error | null, number], [Error | null, number]];
      return results[0][1] as number;
    } catch (error) {
      this.logger.warn(`Redis increment failed for key ${key}: ${(error as Error).message}`);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.checkConnection()) return false;

    try {
      const count = await this.client.exists(key);
      return count > 0;
    } catch {
      return false;
    }
  }

  async blacklistToken(tokenHash: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:refresh:${tokenHash}`, '1', ttlSeconds);
  }

  async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
    const result = await this.get<string>(`blacklist:refresh:${tokenHash}`);
    return result !== null;
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    if (!this.checkConnection()) return 0;
    return this.client.incr(`token_version:${userId}`);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.incrementTokenVersion(userId);
  }

  async rpush(key: string, value: string): Promise<void> {
    if (!this.checkConnection()) return;

    try {
      await this.client.rpush(key, value);
    } catch {
      // graceful degradation
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (!this.checkConnection()) return;

    try {
      await this.client.ltrim(key, start, stop);
    } catch {
      // graceful degradation
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'degraded'; latencyMs: number | null }> {
    if (!this.connected) {
      return { status: 'degraded', latencyMs: null };
    }
    const t0 = Date.now();
    try {
      await this.client.ping();
      return { status: 'ok', latencyMs: Date.now() - t0 };
    } catch {
      return { status: 'degraded', latencyMs: null };
    }
  }
}
