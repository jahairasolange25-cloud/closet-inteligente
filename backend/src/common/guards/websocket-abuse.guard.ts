import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class WebSocketAbuseGuard {
  private readonly logger = new Logger(WebSocketAbuseGuard.name);
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly MAX_EVENTS_PER_WINDOW = 100;
  private readonly WINDOW_MS = 10000;
  private readonly MAX_PAYLOAD_SIZE = 65536;

  private readonly SUSPICIOUS_PATTERNS = [
    /<script\b/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /'.*or.*1=1/i,
    /union.*select/i,
    /\/etc\/passwd/i,
    /\.\.\/\.\.\//,
  ];

  validateConnection(userId: string): boolean {
    const key = `connect:${userId}`;
    const entry = this.getOrCreateEntry(key);

    if (entry.count > 10) {
      this.logger.warn(`[WS Abuse] Rapid connect/disconnect from user ${userId}`);
      return false;
    }

    return true;
  }

  validateMessage(userId: string, data: unknown): boolean {
    const payload = JSON.stringify(data);

    if (payload.length > this.MAX_PAYLOAD_SIZE) {
      this.logger.warn(`[WS Abuse] Oversized payload (${payload.length}B) from user ${userId}`);
      throw new WsException('Payload too large');
    }

    const key = `events:${userId}`;
    const entry = this.getOrCreateEntry(key);
    entry.count++;

    if (entry.count > this.MAX_EVENTS_PER_WINDOW) {
      this.logger.warn(`[WS Abuse] Rate limit exceeded for user ${userId}`);
      throw new WsException('Rate limit exceeded');
    }

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(payload)) {
        this.logger.warn(`[WS Abuse] Suspicious payload detected from user ${userId}: ${pattern}`);
        throw new WsException('Message rejected');
      }
    }

    return true;
  }

  private getOrCreateEntry(key: string): RateLimitEntry {
    const now = Date.now();
    let entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.WINDOW_MS };
      this.rateLimits.set(key, entry);
    }

    // Periodic cleanup
    if (this.rateLimits.size > 10000) {
      this.cleanup();
    }

    return entry;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimits) {
      if (now > entry.resetAt) {
        this.rateLimits.delete(key);
      }
    }
  }

  recordDisconnect(userId: string): void {
    const key = `disconnect:${userId}`;
    const entry = this.getOrCreateEntry(key);
    entry.count++;
  }
}
