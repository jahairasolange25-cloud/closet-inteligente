import { Injectable, Logger, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

interface RequestProfile {
  count: number;
  firstSeen: number;
  lastSeen: number;
  methods: Set<string>;
  paths: Set<string>;
}

@Injectable()
export class AnomalyDetectionGuard implements CanActivate {
  private readonly logger = new Logger(AnomalyDetectionGuard.name);
  private readonly profiles = new Map<string, RequestProfile>();
  private readonly SUSPICIOUS_THRESHOLD = 100;
  private readonly WINDOW_MS = 60000;

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id || request.ip;
    const method = request.method;
    const path = request.route?.path || request.url;

    const profile = this.getOrCreateProfile(userId);
    profile.count++;
    profile.lastSeen = Date.now();
    profile.methods.add(method);
    profile.paths.add(path);

    if (profile.count > this.SUSPICIOUS_THRESHOLD) {
      const duration = Date.now() - profile.firstSeen;
      const rate = (profile.count / duration) * 1000;
      this.logger.warn(
        `[Anomaly] High request rate from ${userId}: ${profile.count} requests ` +
        `in ${duration}ms (${rate.toFixed(1)}/s), methods: [${[...profile.methods].join(',')}]`,
      );
    }

    if (profile.paths.size > 50 && profile.count > 50) {
      this.logger.warn(
        `[Anomaly] Path enumeration detected from ${userId}: ` +
        `${profile.paths.size} unique paths in ${profile.count} requests`,
      );
    }

    return true;
  }

  private getOrCreateProfile(key: string): RequestProfile {
    const now = Date.now();
    let profile = this.profiles.get(key);

    if (!profile || now - profile.lastSeen > this.WINDOW_MS) {
      profile = { count: 0, firstSeen: now, lastSeen: now, methods: new Set(), paths: new Set() };
      this.profiles.set(key, profile);
    }

    if (this.profiles.size > 10000) {
      this.cleanup();
    }

    return profile;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, profile] of this.profiles) {
      if (now - profile.lastSeen > this.WINDOW_MS * 2) {
        this.profiles.delete(key);
      }
    }
  }
}
