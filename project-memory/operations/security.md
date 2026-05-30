# Security Operations — Closet Inteligente

> **Last Updated:** 2026-05-27

---

## Dependency Audit Pipeline

Runs weekly (Monday 06:00 UTC) and on PRs modifying dependency files:

| Tool | Scope | Schedule |
|------|-------|----------|
| `npm audit` | Backend (Node.js) | Weekly + on dep changes |
| `pnpm audit` | Frontend (Next.js) | Weekly + on dep changes |
| `pip-audit` | Python AI service | Weekly + on dep changes |
| `trufflehog` | Full repo secrets | Weekly + on push to main |
| CodeQL | JS/TS + Python | Weekly + on push |

**Response:** High/critical findings must be resolved within 7 days.

---

## CSP Policy

Currently enforced via helmet.js middleware. Directives:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: res.cloudinary.com *.cloudinary.com
connect-src 'self' ws: wss:
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

---

## JWT Security

| Property | Value |
|----------|-------|
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| Token blacklist | Redis (JTI-based) |
| Refresh rotation | New refresh token issued on each refresh |
| Replay detection | JTI stored in Redis with TTL matching token expiry |

**If JWT replay detected:**
1. Log `SUSPICIOUS_ACTIVITY` event
2. Blacklist all tokens for that user
3. Increment `jwt_replay_detected` counter metric

---

## Upload Security

| Protection | Implementation |
|-----------|---------------|
| Magic bytes validation | `FileMagicPipe` validates MIME before processing |
| File size limit | 50MB (nginx) + 1MB (NestJS body-parser) |
| Cloudinary signed URLs | Backend generates signed upload URLs |
| Temp file auto-cleanup | FileManager deletes after processing |

---

## WebSocket Abuse Protections

| Protection | Threshold | Action |
|-----------|-----------|--------|
| Rapid connect/disconnect | >10 connections in 10s | Connection rejected |
| Event rate limit | >100 events in 10s | `WsException` thrown |
| Payload size limit | >64KB | Message rejected |
| SQL injection patterns | Regex match | Message rejected |
| XSS patterns | Regex match | Message rejected |

---

## Anomaly Detection

| Pattern | Threshold | Action |
|---------|-----------|--------|
| High request rate | >100 req in 60s | WARN log, metric increment |
| Path enumeration | >50 unique paths | WARN log |
| Expired JWT loop | Rate-limited by `RateLimitGuard` | 429 response |

---

## Audit Log Retention

| Log Type | Retention | Storage |
|----------|-----------|---------|
| API audit logs | 90 days | PostgreSQL (audit_logs table) |
| Application logs | 30 days | Docker json-file (max 5 files × 10MB) |
| Nginx access logs | 90 days | Volume: `closet-logs` |
| Security events | 365 days | PostgreSQL + Redis |
| Metrics data | 15 days | Prometheus TSDB |

---

## Security Incident Response

### Triage (15 min)
1. Identify affected service/user
2. Check if automated mitigation engaged
3. Assess blast radius

### Containment (30 min)
1. Blacklist compromised tokens
2. Rate-limit offending IP/user
3. Rotate secrets if leaked

### Recovery (2 hours)
1. Restore from backup if data affected
2. Verify mitigation effectiveness
3. Document in incident report

---

## Playbooks

### Playbook: Secret Leak
1. Revoke leaked secret immediately
2. Rotate all secrets in vault
3. Run full secret scan with trufflehog
4. Check git history for prior leaks
5. Force rotate all users if user data affected

### Playbook: DoS / Rate Limit Abuse
1. Verify rate limit guard is active
2. Check `rate_limit_exceeded` metric
3. Identify source IP/user pattern
4. Add IP to nginx blocklist if needed
5. Temporarily tighten rate limits

### Playbook: JWT Replay Attack
1. Check `jwt_replay_detected` metric
2. Identify affected user/token
3. Blacklist all user tokens in Redis
4. Force user to re-authenticate
5. Audit user activity for compromise

### Playbook: Supply Chain Vulnerability
1. Identify vulnerable package via audit
2. Check if exploitable in current deployment
3. Apply patch or pin safe version
4. Re-run audit to verify
5. Deploy patched version within SLA (high: 7d, critical: 48h)
