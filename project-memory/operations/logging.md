# Logging Strategy

## Overview
A centralized, structured logging system across all services ensures consistent observability, debuggability, and audit compliance. All logs follow a JSON format with strict PII masking rules and defined retention policies.

---

## Structured Logging Format

### Base Log Schema (All Services)

```json
{
  "timestamp": "2026-05-25T14:30:00.123Z",
  "level": "INFO",
  "service": "api-gateway",
  "environment": "production",
  "request_id": "req_abc123def456",
  "trace_id": "trace_xyz789",
  "span_id": "span_uvw456",
  "message": "Request completed",
  "logger": {
    "name": "HttpLogger",
    "version": "1.0.0",
    "thread": "main-thread-1"
  },
  "metadata": {}
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO 8601 string | Yes | Event timestamp with millisecond precision (UTC) |
| `level` | string | Yes | Log level: `ERROR`, `WARN`, `INFO`, `DEBUG` |
| `service` | string | Yes | Service name (see service registry below) |
| `environment` | string | Yes | Deployment environment: `production`, `staging`, `development` |
| `request_id` | string | Yes | Correlation ID for the request (generated at API gateway) |
| `trace_id` | string | Conditional | Distributed trace ID (present if tracing is enabled) |
| `span_id` | string | Conditional | Span ID within the trace |
| `message` | string | Yes | Human-readable log message |
| `logger` | object | Yes | Logger metadata (name, version, thread) |
| `metadata` | object | No | Additional structured data (see per-service schemas) |
| `error` | object | Conditional | Error details (only on ERROR level) |
| `user_id` | string | Conditional | Hashed user identifier (never raw user ID) |
| `duration_ms` | number | Conditional | Operation duration in milliseconds |

---

## Log Levels

### Level Definitions

| Level | Value | Description | Action Required |
|-------|-------|-------------|-----------------|
| `ERROR` | 0 | Application error that requires immediate investigation | Alert triggered, on-call notified |
| `WARN` | 1 | Unexpected condition that doesn't prevent operation | Review within 24 hours |
| `INFO` | 2 | Normal operational events | No action required |
| `DEBUG` | 3 | Detailed diagnostic information | Only enabled during debugging sessions |

### Level Usage Guidelines

#### ERROR
- Unhandled exceptions and crashes
- Failed database operations (connection failures, constraint violations)
- External service failures (Cloudinary upload failed, Supabase unavailable)
- Authentication or authorization failures (after retries exhausted)
- AI pipeline processing failures
- Data integrity violations
- Rate limit breaches that affect users
- Failed file uploads or processing
- WebSocket connection failures
- Any operation that returns a 5xx status code

```json
{
  "timestamp": "2026-05-25T14:30:00.123Z",
  "level": "ERROR",
  "service": "ai-pipeline",
  "request_id": "req_abc123",
  "message": "Garment detection failed",
  "metadata": {
    "image_id": "img_456",
    "model": "detectron2-garment",
    "error_type": "INFERENCE_TIMEOUT",
    "attempt": 2
  },
  "error": {
    "name": "InferenceError",
    "message": "Model inference exceeded timeout of 30s",
    "stack": "InferenceError: Model inference exceeded timeout of 30s\n at Object.detect (services/detection.service.ts:45)\n at process.processT...
  }
}
```

#### WARN
- High latency operations (exceeding p95 but not p99)
- Retry attempts on transient failures
- Deprecated API usage
- Rate limiting beginning to throttle (low capacity remaining)
- Cache misses on frequently accessed keys
- Slow queries (>500ms but <1s)
- Near-resource-limits (connections >80%, memory >70%)
- Input validation warnings (malformed but non-blocking)
- Authentication attempts from new geographic locations
- AI pipeline low confidence scores (>50% but <75%)

```json
{
  "timestamp": "2026-05-25T14:30:00.123Z",
  "level": "WARN",
  "service": "api-gateway",
  "request_id": "req_def456",
  "message": "Rate limit threshold approaching",
  "metadata": {
    "user_id": "usr_hash_789",
    "endpoint": "/api/garments/search",
    "current_rate": 85,
    "limit": 100,
    "window_seconds": 60
  }
}
```

#### INFO
- Request start and completion (sampled for high-traffic endpoints)
- User registration and login
- Wardrobe item creation, update, deletion
- Outfit creation and sharing
- AI pipeline job start and completion
- File upload start and completion
- Avatar generation start and completion
- Payment or subscription events
- Background job execution
- Cache population events
- Database migrations
- Deployment events
- Configuration changes

```json
{
  "timestamp": "2026-05-25T14:30:00.123Z",
  "level": "INFO",
  "service": "user-service",
  "request_id": "req_ghi789",
  "message": "User registered successfully",
  "metadata": {
    "user_id": "usr_hash_012",
    "registration_method": "google_oauth",
    "onboarding_step": "complete",
    "duration_ms": 234
  }
}
```

#### DEBUG
- SQL query text (parameterized, values redacted)
- HTTP request and response headers (authorization header redacted)
- State transitions in stateful services
- Cache key lookups and results
- AI model input shapes and preprocessing steps
- WebSocket message payloads (user content redacted)
- Memory and CPU usage snapshots
- Third-party API request/response bodies (credentials redacted)
- Feature flag evaluations
- Circuit breaker state changes

```json
{
  "timestamp": "2026-05-25T14:30:00.123Z",
  "level": "DEBUG",
  "service": "ai-pipeline",
  "request_id": "req_jkl012",
  "message": "Image preprocessing complete",
  "metadata": {
    "image_id": "img_345",
    "original_size": [3024, 4032],
    "resized_to": [800, 1067],
    "normalization": "imagenet",
    "duration_ms": 45
  }
}
```

---

## Log Categories Per Service

### 1. API Gateway (NestJS)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `http.request` | INFO | Incoming HTTP request (sampled) |
| `http.response` | INFO | HTTP response with status and duration |
| `http.error` | ERROR | 5xx responses |
| `http.rate_limit` | WARN | Rate limiting events |
| `auth.login` | INFO | Login attempts (success/failure) |
| `auth.token_refresh` | INFO | Token refresh events |
| `middleware.cors` | DEBUG | CORS validation |
| `middleware.csp` | WARN | CSP violation reports |
| `websocket.connect` | INFO | WebSocket connection events |
| `websocket.disconnect` | INFO | WebSocket disconnection events |
| `websocket.error` | ERROR | WebSocket errors |

### 2. User Service (NestJS)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `user.create` | INFO | User registration |
| `user.update` | INFO | Profile updates |
| `user.delete` | WARN | Account deletion |
| `user.preferences` | DEBUG | Preference changes |
| `user.onboarding` | INFO | Onboarding progress |
| `user.subscription` | INFO | Subscription changes |

### 3. Garment Service (NestJS)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `garment.create` | INFO | New wardrobe item |
| `garment.update` | INFO | Item details update |
| `garment.delete` | INFO | Item removal |
| `garment.search` | INFO | Search queries |
| `garment.view` | DEBUG | Item view events |
| `garment.image.process` | INFO | Image processing events |

### 4. Outfit Service (NestJS)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `outfit.create` | INFO | Outfit creation |
| `outfit.update` | INFO | Outfit modification |
| `outfit.delete` | INFO | Outfit deletion |
| `outfit.share` | INFO | Outfit sharing |
| `outfit.recommend` | INFO | Recommendation generation |
| `outfit.favorite` | DEBUG | Favorite/unfavorite |

### 5. AI Pipeline (Python)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `ai.job.start` | INFO | AI job started |
| `ai.job.complete` | INFO | AI job completed |
| `ai.job.fail` | ERROR | AI job failed |
| `ai.preprocess` | DEBUG | Image preprocessing |
| `ai.inference` | INFO | Model inference execution |
| `ai.postprocess` | DEBUG | Result postprocessing |
| `ai.model.load` | INFO | Model loading events |
| `ai.model.unload` | INFO | Model unloading |
| `ai.queue.status` | WARN | Queue depth warnings |
| `ai.health` | INFO | Health check results |

#### AI Pipeline Sub-Categories
| Category | Log Level | Description |
|----------|-----------|-------------|
| `ai.detection` | INFO | Garment detection results |
| `ai.size_estimation` | INFO | Size prediction results |
| `ai.color_analysis` | INFO | Color analysis results |
| `ai.outfit_generation` | INFO | Outfit recommendation results |
| `ai.avatar_generation` | INFO | Avatar generation progress |
| `ai.virtual_tryon` | INFO | Virtual try-on results |

### 6. Storage Service (NestJS)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `storage.upload.start` | INFO | Upload started |
| `storage.upload.complete` | INFO | Upload completed |
| `storage.upload.fail` | ERROR | Upload failed |
| `storage.delete` | INFO | File deletion |
| `storage.cloudinary.sync` | INFO | Cloudinary sync events |
| `storage.image.process` | DEBUG | Image processing (resize, optimize) |
| `storage.video.process` | DEBUG | Video processing |

### 7. Real-time Service (NestJS + Socket.IO)
| Category | Log Level | Description |
|----------|-----------|-------------|
| `ws.connection.new` | INFO | New WebSocket connection |
| `ws.connection.close` | INFO | WebSocket connection closed |
| `ws.room.join` | DEBUG | User joined room |
| `ws.room.leave` | DEBUG | User left room |
| `ws.message.send` | DEBUG | Outgoing message |
| `ws.message.receive` | DEBUG | Incoming message |
| `ws.error` | ERROR | WebSocket error |
| `notification.send` | INFO | Push notification sent |
| `notification.fail` | WARN | Push notification failure |

### 8. Background Jobs
| Category | Log Level | Description |
|----------|-----------|-------------|
| `job.start` | INFO | Job execution started |
| `job.complete` | INFO | Job completed successfully |
| `job.fail` | ERROR | Job failed |
| `job.retry` | WARN | Job retry attempt |
| `job.timeout` | ERROR | Job timed out |
| `cron.trigger` | DEBUG | Cron job triggered |
| `cron.complete` | INFO | Cron job completed |

### 9. Database
| Category | Log Level | Description |
|----------|-----------|-------------|
| `db.query` | DEBUG | Query execution (parameterized) |
| `db.slow_query` | WARN | Query exceeding 500ms |
| `db.connection` | INFO | Connection pool events |
| `db.migration` | INFO | Migration execution |
| `db.transaction` | DEBUG | Transaction begin/commit/rollback |
| `db.error` | ERROR | Database errors |
| `db.backup` | INFO | Backup events |
| `db.replication` | WARN | Replication status changes |

### 10. Redis
| Category | Log Level | Description |
|----------|-----------|-------------|
| `redis.connect` | INFO | Connection established |
| `redis.disconnect` | WARN | Connection lost |
| `redis.reconnect` | INFO | Reconnection attempt |
| `redis.cache_hit` | DEBUG | Cache hit |
| `redis.cache_miss` | DEBUG | Cache miss |
| `redis.eviction` | WARN | Key eviction |
| `redis.error` | ERROR | Operation error |

---

## PII Masking Rules

### Automatically Redacted Fields
The following fields are NEVER logged in plaintext. If they appear in any log data, they are automatically redacted or hashed before output.

| Category | Fields | Action |
|----------|--------|--------|
| **Authentication** | Password, password_hash, password_reset_token | Completely removed |
| **Tokens** | JWT, access_token, refresh_token, session_token | Removed (log only token type + prefix) |
| **Personal Identifiers** | Email, phone, full_name, address, government_id, passport | Hashed (SHA-256) or truncated (first/last char only) |
| **Financial** | Credit card, bank account, payment_method token | Completely removed |
| **Biometric** | Face images, body measurements (beyond what's needed for model) | Removed from log context |
| **Location** | GPS coordinates, IP address | IP anonymized (last octet zeroed); coordinates rounded to 0.1 degree |
| **Device** | Device ID, advertising ID, IMEI | Hashed |
| **Content** | Chat messages, user-generated text content | Logged only for moderation events with user consent |
| **Headers** | Authorization, Cookie, X-API-Key, Set-Cookie | Removed; logged only as present/absent |

### PII Redaction Implementation

```typescript
// Example PII redaction middleware pseudocode
const PII_PATTERNS = [
  { pattern: /(["']?password["']?\s*[:=]\s*["']).+?(["'])/gi, replacement: '$1[REDACTED]$2' },
  { pattern: /(access_token["']?\s*[:=]\s*["']).+?(["'])/gi, replacement: '$1[REDACTED]$2' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  { pattern: /\b\d{16}\b/g, replacement: '[CARD_REDACTED]' },                // Credit card numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },      // SSN pattern
  { pattern: /"authorization":\s*"[^"]*"/gi, replacement: '"authorization":"[REDACTED]"' },
];

function redactPII(logData: object): object {
  const serialized = JSON.stringify(logData);
  const redacted = PII_PATTERNS.reduce(
    (str, { pattern, replacement }) => str.replace(pattern, replacement),
    serialized
  );
  return JSON.parse(redacted);
}
```

### User ID Hashing
- Raw user UUIDs are never logged
- User IDs are hashed with SHA-256 + a per-environment salt
- Hashed user IDs are used for correlation across services
- Salt is rotated quarterly, old salts retained for 90 days for log correlation

---

## Log Retention Policy

| Storage Tier | Duration | Storage Medium | Format | Access |
|-------------|----------|---------------|--------|--------|
| Hot (Active) | 30 days | Elasticsearch (3 nodes, replicated) | JSON, indexed | Kibana, API |
| Warm (Archive) | 60 days (days 31-90) | Elasticsearch (reduced replicas) | JSON, indexed | Kibana (slower) |
| Cold (Archive) | 365 days | S3-compatible (Backblaze B2) / GCS | Compressed JSON (gzip) | Athena/SQL queries |
| Compliance Hold | Per legal requirement | S3 Glacier / Deep Archive | Compressed JSON (gzip) | Restoration required |

### Retention Exceptions
- **Audit logs**: Retained for 7 years (see Audit Log section)
- **Security logs**: Retained for 1 year
- **Billing/payment logs**: Retained for 7 years (GDPR compliance)
- **Error logs**: Retained for 1 year (for trend analysis)
- **Debug logs**: Retained for 7 days in hot storage only

### Automated Cleanup
- Daily cron job removes logs exceeding retention period
- Elasticsearch ILM (Index Lifecycle Management) policies automate hot -> warm -> delete transitions
- Cold storage lifecycle policy moves objects to Glacier after 90 days
- Compliance hold logs are excluded from automated deletion
- Cleanup verification runs weekly with summary report

---

## Log Correlation with Request IDs

### Request ID Generation
- Generated at the API Gateway (NestJS) for every incoming HTTP request
- Format: `req_` + 20 characters of base62 entropy (e.g., `req_a3Bx8kM2nP9qR5vW7yZ`)
- Included in the response header `X-Request-ID`
- Propagated to all downstream services via HTTP headers (`X-Request-ID`)

### Request ID Propagation
```
[Browser]                    [API Gateway]              [User Service]
    |                              |                          |
    |--- Request ----------------> |                          |
    |                         Generate request_id            |
    |                              |--- request_id ---------> |
    |                              |    + SQL queries (DEBUG) |
    |                              |    + Redis ops (DEBUG)   |
    |                              |<-- request_id ---------- |
    |<-- Response (X-Request-ID)-- |                          |
    |                              |                          |
    |--- WebSocket -------------- |                          |
    |   (query param: req_id)     |--- req_id -------------> |
```

### Correlation in Distributed Services
- Same `request_id` flows through API Gateway -> NestJS microservices -> Python AI services -> database
- For async jobs (AI pipeline), the `request_id` is persisted in the job metadata
- When querying logs, filtering by `request_id` retrieves all log entries across all services for that request
- WebSocket connections pass `request_id` as a query parameter during handshake

### Trace Propagation
- `trace_id` and `span_id` follow OpenTelemetry W3C Trace Context format
- `traceparent` header is used for propagation between services
- Logs include both `trace_id` and `span_id` for end-to-end trace correlation

---

## Centralized Log Aggregation

### Architecture

```
[Service Containers]
    |  stdout/stderr
    v
[Vector Log Agent]  (sidecar container per host)
    |  HTTPS with TLS
    v
[Load Balancer]     (round-robin across aggregators)
    |
    +---> [Log Aggregator 1] ----+
    +---> [Log Aggregator 2] ----+----> [Elasticsearch Cluster]
    +---> [Log Aggregator N] ----+         |
                                           v
                                    [Kibana] ---> [Alerts]
                                               ---> [S3 Archive]
                                               ---> [Log Analysis]
```

### Aggregation Pipeline
1. **Collection**: Vector agent reads container stdout/stderr, parses JSON, adds metadata (host, container ID, environment)
2. **Buffering**: Logs are buffered in memory (max 10MB) with disk fallback
3. **Transport**: HTTPS POST with TLS 1.3, compressed (gzip), batch size 500 logs or 5MB
4. **Validation**: Aggregator validates JSON schema, rejects malformed logs
5. **PII Redaction**: Server-side PII redaction as safety net (client-side redaction is primary)
6. **Indexing**: Elasticsearch indexing with daily index rotation (`logs-2026.05.25`)
7. **Alerting**: Real-time alert evaluation on indexed logs
8. **Archival**: 30-day hot retention, then move to warm, then cold storage

### Elasticsearch Index Configuration
- **Index pattern**: `logs-{environment}-{yyyy.MM.dd}`
- **Shards**: 3 primary, 1 replica per index
- **Mapping**: Dynamic mapping with field limits (max 1000 fields per index)
- **Analysis**: Standard analyzer with custom stop words list for message field
- **ILM Policy**:
  - Hot phase (30 days): 3 shards, 1 replica, max age 30d
  - Warm phase (30 days): 3 shards, 0 replicas, max age 60d
  - Delete phase: Delete index after 90 days

---

## Log Query Patterns for Debugging

### Common Debugging Scenarios

#### Scenario 1: A specific user is experiencing an issue
```kibana
query: request_id: "req_a3Bx8kM2nP9qR5vW7yZ"
time: last 24 hours
```

#### Scenario 2: AI pipeline job failed
```kibana
query: service: "ai-pipeline" AND level: "ERROR" AND category: "ai.job.fail"
time: last 4 hours
```

#### Scenario 3: Database performance degradation
```kibana
query: service: "api-gateway" AND category: "db.slow_query"
time: last 1 hour
sort: @timestamp desc
```

#### Scenario 4: Upload failures for a specific time window
```kibana
query: category: "storage.upload.fail"
time: last 30 minutes
```

#### Scenario 5: Error rate spike investigation
```kibana
query: level: "ERROR"
time: last 15 minutes
aggregation: count by service
```

#### Scenario 6: WebSocket connection issues
```kibana
query: category: "ws.error" OR category: "ws.connection.close"
time: last 1 hour
aggregation: count by ws_room_id
```

#### Scenario 7: Authentication failures
```kibana
query: category: "auth.login" AND metadata.status: "failure"
time: last 24 hours
aggregation: count by source_ip (anonymized)
```

#### Scenario 8: Specific trace debugging
```kibana
query: trace_id: "trace_xyz789"
time: last 2 hours
sort: @timestamp asc
```

#### Scenario 9: Redis cache issues
```kibana
query: service: "api-gateway" AND (category: "redis.cache_miss" OR category: "redis.eviction")
time: last 1 hour
```

#### Scenario 10: Slow endpoint identification
```kibana
query: category: "http.response" AND metadata.duration_ms > 2000
time: last 4 hours
aggregation: top 10 by count
```

### Saved Queries (Kibana)
All common queries above are saved as Kibana search objects with the naming pattern `[Debug] [Service] [Scenario]`.

---

## Audit Log Requirements

### Audit Events
The following events MUST be logged with special audit treatment (non-repudiable, immutable, extended retention):

| Event | Category | Data Captured |
|-------|----------|---------------|
| User registration | `audit.user.create` | Timestamp, user_id (hashed), registration method, IP (anonymized) |
| User login | `audit.user.login` | Timestamp, user_id (hashed), method, IP (anonymized) |
| User logout | `audit.user.logout` | Timestamp, user_id (hashed) |
| Account deletion | `audit.user.delete` | Timestamp, user_id (hashed), reason |
| Profile data export | `audit.user.data_export` | Timestamp, user_id (hashed), data types exported |
| Password change | `audit.user.password_change` | Timestamp, user_id (hashed) |
| Permission change | `audit.user.role_change` | Timestamp, user_id (hashed), old role, new role, admin_id |
| Garment created | `audit.garment.create` | Timestamp, user_id (hashed), garment_id (hashed) |
| Garment deleted | `audit.garment.delete` | Timestamp, user_id (hashed), garment_id (hashed) |
| Outfit shared publicly | `audit.outfit.share` | Timestamp, user_id (hashed), outfit_id (hashed), visibility |
| Payment event | `audit.payment.*` | Timestamp, user_id (hashed), amount (encrypted), method_type, status |
| Admin action | `audit.admin.*` | Timestamp, admin_id (hashed), action, target, details |
| API key creation/revocation | `audit.api_key.*` | Timestamp, user_id (hashed), key prefix |
| Data deletion (GDPR) | `audit.gdpr.delete` | Timestamp, user_id (hashed), data categories deleted |
| Consent change | `audit.consent.update` | Timestamp, user_id (hashed), consent type, granted/revoked |

### Audit Log Format
Audit logs use the standard structured format with these additions:
- `audit`: `true` (boolean flag for easy filtering)
- `category`: Prefixed with `audit.` (e.g., `audit.user.create`)
- `metadata.audit`: Object containing audit-specific fields
- Non-repudiation: Audit logs are written to a separate, append-only index

### Audit Log Storage
- **Separate index**: `audit-{environment}-{yyyy.MM.dd}`
- **Write-once**: Index is configured with `index.blocks.write: false` but application never updates or deletes
- **Retention**: 7 years
- **Immutable storage**: After 90 days, audit logs are written to WORM (Write Once Read Many) storage
- **Access control**: Audit logs are accessible only to security team and compliance officers
- **Backup**: Audit logs are backed up daily with encryption

---

## Log Volume Management

### Volume Estimates

| Service | Logs/Day (INFO) | Logs/Day (DEBUG) | Storage/Day (INFO) | Storage/Day (DEBUG) |
|---------|----------------|-------------------|-------------------|---------------------|
| API Gateway | 500,000 | 2,000,000 | 500 MB | 2 GB |
| User Service | 50,000 | 200,000 | 50 MB | 200 MB |
| Garment Service | 100,000 | 400,000 | 100 MB | 400 MB |
| Outfit Service | 50,000 | 200,000 | 50 MB | 200 MB |
| AI Pipeline | 200,000 | 1,000,000 | 500 MB | 2.5 GB |
| Storage Service | 100,000 | 500,000 | 100 MB | 500 MB |
| Real-time Service | 50,000 | 300,000 | 50 MB | 300 MB |
| Background Jobs | 20,000 | 100,000 | 20 MB | 100 MB |
| **Total** | **1,070,000** | **4,700,000** | **1.37 GB** | **6.2 GB** |

### Cost Projection (Hot Tier, 30 days)
- Total monthly storage: ~227 GB (INFO) + ~186 GB (DEBUG) = ~413 GB
- Elasticsearch storage with replication: ~826 GB
- Estimated monthly cost (managed Elasticsearch): ~$400-600

### Volume Reduction Strategies

| Strategy | Impact | Implementation |
|----------|--------|----------------|
| **DEBUG sampling** | 80% reduction in DEBUG volume | Sample 1:10 for high-traffic DEBUG logs; 1:100 for health check logs |
| **INFO sampling for health checks** | Eliminates ~300K logs/day | Do not log health check requests at INFO level; only log failures |
| **Log aggregation** | 50% reduction in similar logs | Aggregate repeated identical logs within 1-minute window; log count |
| **Log level granularity** | On-demand | Set service-level log levels via config; production runs most services at INFO, DEBUG only during debugging |
| **Drop noisy logs** | Custom | Identify and suppress overly noisy but low-value logs; review monthly |

### Target Volumes (after reduction)
| Service | Target Logs/Day (INFO) | Target Storage/Day |
|---------|----------------------|-------------------|
| API Gateway | 150,000 | 150 MB |
| User Service | 40,000 | 40 MB |
| Garment Service | 75,000 | 75 MB |
| Outfit Service | 40,000 | 40 MB |
| AI Pipeline | 100,000 | 250 MB |
| Storage Service | 60,000 | 60 MB |
| Real-time Service | 30,000 | 30 MB |
| Background Jobs | 15,000 | 15 MB |
| **Total** | **510,000** | **660 MB/day** |

### Log Throttling
- **Per-service rate limit**: Maximum 10,000 logs/second per service instance
- **Burst limit**: 20,000 logs/second for up to 10 seconds
- **Throttle action**: Logs beyond limit are dropped with a counter tracked in metrics
- **Throttle alert**: When >1% of logs are dropped, trigger a WARN alert

---

## Logging Implementation Requirements

### Service Requirements
Every service MUST:
1. Output logs to stdout/stderr in JSON format (never log to files in production)
2. Include `request_id`, `service`, `environment`, and `level` in every log entry
3. Implement PII redaction before emitting logs
4. Support dynamic log level configuration (via environment variable or API)
5. Handle logging failures gracefully (never crash due to logging failure)
6. Use async logging to avoid blocking request processing
7. Reset log context at the beginning of each request

### Configuration

```typescript
// Example Winston logger configuration for NestJS
interface LogConfig {
  level: string;                            // 'error' | 'warn' | 'info' | 'debug'
  format: 'json';                           // Always JSON in production
  piiRedaction: boolean;                    // Always true in production
  redactionFields: string[];                // Fields to redact
  sampling: {                               // Sampling configuration
    enabled: boolean;
    rate: number;                           // 1 = log all, 10 = log 1 in 10
    endpoints: string[];                    // Endpoint patterns to sample
  };
  sentry: {                                 // Error tracking integration
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
}
```

### Environment-Specific Configuration

| Environment | Log Level | PII Redaction | Sampling | Debug Endpoints |
|-------------|-----------|--------------|----------|-----------------|
| Production | INFO | Enabled | 1:10 for selected | Disabled |
| Staging | DEBUG | Enabled | None | Disabled |
| Development | DEBUG | Disabled (mock data) | None | Enabled |

---

## Logging Anti-Patterns (Do Not)

| Anti-Pattern | Why | Instead |
|-------------|-----|---------|
| Logging passwords or tokens | Security breach | Redact all auth fields |
| Logging entire request/response bodies | PII exposure, volume explosion | Log metadata only |
| Using `console.log` directly | No structured format, no levels | Use the configured logger |
| Logging in sync mode | Performance impact | Use async logging |
| Logging sensitive data even in debug | Accidental production leak | Redact everywhere |
| Writing logs to files in production | Log loss on container restart | Always stdout/stderr |
| Including stack traces in WARN/INFO | Noise, wasted storage | Only include in ERROR |
| Using string interpolation for logs | Poor queryability | Always structured fields |
| Not including request_id | Uncordable logs | Always include correlation ID |
| Logging in loops (hot paths) | Performance disaster, volume spike | Log aggregates or samples |

---

## Logging Tools and Libraries

| Service | Library | Notes |
|---------|---------|-------|
| NestJS (Backend) | Winston + nest-winston | Structured JSON, daily rotate, custom transports |
| Next.js (Frontend) | pino + next-pino | Browser-compatible, structured |
| Python (AI Pipeline) | structlog + logging | JSON output, OpenTelemetry integration |
| Log Agent | Vector | Lightweight, high throughput, log parsing |
| Aggregation | Elasticsearch + Kibana | Full-text search, visualization, alerting |
| Error Tracking | Sentry | Exception tracking, performance monitoring, release health |
| Audit | Dedicated audit service | Append-only log writer with integrity verification |

---

## Log Review Cadence

| Review Type | Frequency | Participants | Focus |
|-------------|-----------|-------------|-------|
| Error log review | Daily (automated) | On-call engineer | New error patterns, critical errors |
| Log volume review | Weekly | Platform engineering | Volume trends, cost optimization |
| PII compliance audit | Monthly | Security team | Verify no PII leakage in logs |
| Sampling review | Monthly | Platform engineering | Adjust sampling rates |
| Retention verification | Monthly | SRE | Verify retention policies enforced |
| Audit log review | Quarterly | Compliance officer | Verify audit completeness |
