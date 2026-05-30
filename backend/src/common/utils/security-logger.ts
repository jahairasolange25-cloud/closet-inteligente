import { Logger } from '@nestjs/common';

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REVOKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_ATTEMPT'
  | 'INVALID_REQUEST'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BRUTE_FORCE_DETECTED'
  | 'UNAUTHORIZED_ACCESS'
  | 'FILE_UPLOAD_REJECTED';

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  userId?: string | null;
  ip?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

const securityLogger = new Logger('Security');

export function logSecurityEvent(event: SecurityEvent): void {
  const message = JSON.stringify({
    event: event.type,
    timestamp: event.timestamp,
    ...(event.userId ? { userId: event.userId } : {}),
    ...(event.ip ? { ip: event.ip } : {}),
    ...(event.path ? { path: event.path } : {}),
    ...(event.method ? { method: event.method } : {}),
    ...(event.userAgent ? { userAgent: event.userAgent } : {}),
    ...(event.metadata ? { metadata: event.metadata } : {}),
  });

  switch (event.type) {
    case 'AUTH_SUCCESS':
      securityLogger.log(message);
      break;
    case 'AUTH_FAILURE':
    case 'RATE_LIMIT_EXCEEDED':
    case 'BRUTE_FORCE_DETECTED':
    case 'CSRF_ATTEMPT':
    case 'SUSPICIOUS_ACTIVITY':
    case 'UNAUTHORIZED_ACCESS':
    case 'FILE_UPLOAD_REJECTED':
      securityLogger.warn(message);
      break;
    case 'INVALID_REQUEST':
      securityLogger.debug(message);
      break;
    default:
      securityLogger.log(message);
  }
}

export function createSecurityEvent(
  type: SecurityEventType,
  overrides: Partial<SecurityEvent> = {},
): SecurityEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
