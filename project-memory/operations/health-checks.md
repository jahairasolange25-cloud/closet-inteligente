# Health Checks

## Overview
Health checks provide automated monitoring of service availability and dependency status across all platform components. They are used by the orchestration platform (Docker, Kubernetes, Railway/Render) for automated recovery decisions and by the monitoring system for alerting.

---

## Health Check Endpoints

### 1. Basic Health Check: GET /health

Simple liveness check indicating the service process is running and can respond to HTTP requests.

**Response**: HTTP 200 OK

`json
{
  "status": "ok",
  "service": "api-gateway",
  "version": "2.5.1",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "uptime_seconds": 86400,
  "host": "api-gateway-prod-7f8c9d2e1a"
}
`

**Failure response**:
`json
{
  "status": "down",
  "service": "api-gateway",
  "version": "2.5.1",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "error": "Service process not responding"
}
`

### 2. Readiness Check: GET /health/ready

Readiness probe that verifies all external dependencies are reachable and the service is ready to accept traffic.

**Response**: HTTP 200 OK (all dependencies healthy)

`json
{
  "status": "ok",
  "service": "garment-service",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "components": {
    "database": {
      "status": "ok",
      "latency_ms": 3
    },
    "redis": {
      "status": "ok",
      "latency_ms": 1
    },
    "cloudinary": {
      "status": "ok",
      "latency_ms": 45
    }
  },
  "latency_ms": 49
}
`

**Response**: HTTP 503 Service Unavailable (dependency degraded)

`json
{
  "status": "degraded",
  "service": "garment-service",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "components": {
    "database": {
      "status": "ok",
      "latency_ms": 3
    },
    "redis": {
      "status": "degraded",
      "latency_ms": 250,
      "error": "High latency detected"
    },
    "cloudinary": {
      "status": "ok",
      "latency_ms": 45
    }
  },
  "latency_ms": 298,
  "message": "Service is degraded but operational"
}
`

**Response**: HTTP 503 Service Unavailable (dependency down)

`json
{
  "status": "down",
  "service": "garment-service",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "components": {
    "database": {
      "status": "down",
      "error": "Connection refused: postgres://db:5432/closet_inteligente"
    },
    "redis": {
      "status": "ok",
      "latency_ms": 1
    },
    "cloudinary": {
      "status": "ok",
      "latency_ms": 45
    }
  },
  "latency_ms": 46,
  "message": "Service cannot accept traffic: database unavailable"
}
`

### 3. Startup Check: GET /health/startup

Startup probe that confirms the service has completed initialization (database migrations, cache warmup, model loading) before it starts receiving traffic.

**Response**: HTTP 200 OK (initialization complete)

`json
{
  "status": "ok",
  "service": "ai-pipeline",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "initialization": {
    "models_loaded": true,
    "model_count": 6,
    "models": [
      "detectron2-garment",
      "size-estimator",
      "color-analyzer",
      "outfit-recommender",
      "avatar-generator",
      "virtual-tryon"
    ],
    "database_migrations": "up_to_date",
    "cache_warmed": true,
    "gpu_available": true,
    "gpu_name": "NVIDIA A10G",
    "gpu_memory_mb": 23000,
    "init_duration_ms": 45000
  }
}
`

**Response**: HTTP 503 Service Unavailable (initializing)

`json
{
  "status": "initializing",
  "service": "ai-pipeline",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "initialization": {
    "models_loaded": false,
    "models_loading": ["detectron2-garment", "avatar-generator"],
    "progress_pct": 60,
    "estimated_time_remaining_ms": 15000
  }
}
`

### 4. Detailed Health Check: GET /health/detailed

Comprehensive health status with all component metrics, only exposed on internal network (never public).

`json
{
  "status": "ok",
  "service": "api-gateway",
  "version": "2.5.1",
  "timestamp": "2026-05-25T14:30:00.123Z",
  "uptime_seconds": 86400,
  "host": "api-gateway-prod-7f8c9d2e1a",
  "environment": "production",
  "components": {
    "database": {
      "status": "ok",
      "type": "postgresql",
      "host": "db-primary.internal",
      "port": 5432,
      "database": "closet_inteligente",
      "pool": {
        "total": 20,
        "active": 5,
        "idle": 15,
        "waiting": 0
      },
      "latency_ms": 3,
      "version": "15.4"
    },
    "redis": {
      "status": "ok",
      "type": "redis",
      "host": "redis-cluster.internal",
      "port": 6379,
      "cluster_mode": true,
      "shards": 3,
      "latency_ms": 1,
      "memory_usage_mb": 1240,
      "maxmemory_mb": 2048,
      "hit_rate": 0.92,
      "connected_clients": 45,
      "version": "7.2"
    },
    "supabase": {
      "status": "ok",
      "latency_ms": 25,
      "service": "storage"
    },
    "cloudinary": {
      "status": "ok",
      "latency_ms": 45,
      "account": "closetinteligente",
      "storage_used_mb": 125000
    },
    "ai_service": {
      "status": "ok",
      "latency_ms": 5,
      "gpu_available": true,
      "queue_depth": 12,
      "workers_active": 3
    }
  },
  "latency_ms": 79,
  "requests": {
    "total": 1500000,
    "last_minute": 2450,
    "errors_last_minute": 5,
    "error_rate_pct": 0.2
  },
  "resources": {
    "cpu_usage_pct": 45,
    "memory_usage_pct": 62,
    "memory_used_mb": 1268,
    "memory_total_mb": 2048,
    "disk_usage_pct": 35,
    "disk_used_mb": 3500,
    "disk_total_mb": 10000
  }
}
`

---

## Component Health Checks

### 1. Database Connectivity Check

`	ypescript
async function checkDatabaseHealth(): Promise<HealthComponent> {
  const start = Date.now();
  try {
    const result = await db.query('SELECT 1 AS healthy');
    const latency = Date.now() - start;

    // Check pool status
    const poolStatus = {
      total: pool.totalCount,
      active: pool.activeCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };

    const status = latency < 100 ? 'ok' : latency < 500 ? 'degraded' : 'down';

    return {
      status,
      latency_ms: latency,
      pool: poolStatus,
      ...(status === 'degraded' && { error: High latency: ms }),
    };
  } catch (error) {
    return {
      status: 'down',
      error: Database unreachable: ,
    };
  }
}
`

### 2. Redis Connectivity Check

`	ypescript
async function checkRedisHealth(): Promise<HealthComponent> {
  const start = Date.now();
  try {
    await redis.ping();
    const latency = Date.now() - start;

    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const maxmemoryMatch = info.match(/maxmemory_human:(\S+)/);
    const hitRateMatch = info.match(/keyspace_hits:(\d+).*keyspace_misses:(\d+)/s);

    const usedMemoryMb = parseMemoryString(memoryMatch?.[1] || '0');
    const maxMemoryMb = parseMemoryString(maxmemoryMatch?.[1] || '2048M');

    const status = latency < 50 ? 'ok' : latency < 200 ? 'degraded' : 'down';

    return {
      status,
      latency_ms: latency,
      memory_usage_mb: usedMemoryMb,
      maxmemory_mb: maxMemoryMb,
      connected_clients: parseInt((await redis.clientList()).split('\n').length - 1),
      ...(status === 'degraded' && { error: High latency: ms }),
    };
  } catch (error) {
    return {
      status: 'down',
      error: Redis unreachable: ,
    };
  }
}
`

### 3. Supabase Connectivity Check

`	ypescript
async function checkSupabaseHealth(): Promise<HealthComponent> {
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    const latency = Date.now() - start;

    if (error) {
      return { status: 'down', error: error.message };
    }

    return {
      status: latency < 100 ? 'ok' : 'degraded',
      latency_ms: latency,
    };
  } catch (error) {
    return {
      status: 'down',
      error: Supabase unreachable: ,
    };
  }
}
`

### 4. Cloudinary Connectivity Check

`	ypescript
async function checkCloudinaryHealth(): Promise<HealthComponent> {
  const start = Date.now();
  try {
    // Ping Cloudinary API
    const result = await cloudinary.api.ping();
    const latency = Date.now() - start;

    // Check account usage
    const usage = await cloudinary.api.usage();

    return {
      status: latency < 200 ? 'ok' : 'degraded',
      latency_ms: latency,
      storage_used_mb: usage.storage.used_mb,
      storage_limit_mb: usage.storage.limit_mb,
      credits_used: usage.credits.used,
      credits_limit: usage.credits.limit,
    };
  } catch (error) {
    return {
      status: 'down',
      error: Cloudinary unreachable: ,
    };
  }
}
`

### 5. AI Service Availability Check

`	ypescript
async function checkAIHealth(): Promise<HealthComponent> {
  const start = Date.now();
  try {
    // Check AI worker availability
    const healthyWorkers = await checkAIWorkers();
    const queueDepth = await aiQueue.getWaitingCount();
    const activeJobs = await aiQueue.getActiveCount();

    return {
      status: healthyWorkers > 0 ? 'ok' : 'down',
      latency_ms: Date.now() - start,
      workers_active: healthyWorkers,
      queue_depth: queueDepth,
      active_jobs: activeJobs,
      gpu_available: await checkGPUAvailability(),
      ...(queueDepth > 100 && { warning: Queue depth high:  }),
    };
  } catch (error) {
    return {
      status: 'down',
      error: AI service unreachable: ,
    };
  }
}
`

---

## Health Check Response Format

### Unified Response Schema

`	ypescript
interface HealthResponse {
  status: 'ok' | 'degraded' | 'down' | 'initializing';
  service: string;
  version?: string;
  timestamp: string;
  uptime_seconds?: number;
  host?: string;
  environment?: string;

  // Component statuses
  components?: {
    [name: string]: HealthComponent;
  };

  // Aggregate latency
  latency_ms?: number;

  // Human-readable message
  message?: string;
}

interface HealthComponent {
  status: 'ok' | 'degraded' | 'down';
  latency_ms?: number;
  error?: string;
  warning?: string;
  [key: string]: any;  // Additional component-specific fields
}
`

### Status Determination Logic

`	ypescript
function determineOverallStatus(components: HealthComponent[]): 'ok' | 'degraded' | 'down' {
  if (components.some(c => c.status === 'down')) {
    return 'down';
  }
  if (components.some(c => c.status === 'degraded')) {
    return 'degraded';
  }
  return 'ok';
}
`

---

## Health Check Frequency

| Check Type | Frequency | Timeout | Purpose |
|-----------|-----------|---------|---------|
| /health (liveness) | Every 30 seconds | 5 seconds | Is the process alive? |
| /health/ready (readiness) | Every 30 seconds | 10 seconds | Can the service accept traffic? |
| /health/startup (startup) | Every 5 seconds (during init) | 60 seconds | Has initialization completed? |
| /health/detailed | Every 60 seconds (internal) | 15 seconds | Full component diagnostics |
| External synthetic check | Every 5 minutes | 30 seconds | End-to-end user flow testing |

### Kubernetes Probe Configuration

`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  template:
    spec:
      containers:
        - name: api-gateway
          image: closet/api-gateway:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
            successThreshold: 1
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 30
            timeoutSeconds: 10
            failureThreshold: 2
            successThreshold: 1
          startupProbe:
            httpGet:
              path: /health/startup
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 60
            failureThreshold: 30  # Max 150 seconds for startup
            successThreshold: 1
`

### Docker Health Check Configuration

`dockerfile
# Dockerfile for API Gateway
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
`

---

## Automated Recovery on Health Check Failure

### Failure Handling by Orchestrator

| Failure Type | Kubernetes Action | Docker Action | Railway/Render Action |
|-------------|-------------------|---------------|----------------------|
| Liveness probe fails (3 times) | Restart container | Restart container | Restart service |
| Readiness probe fails (2 times) | Remove from service endpoints | N/A | Mark as unhealthy |
| Startup probe fails | Kill and restart | Kill and restart | Kill and restart |
| Readiness probe fails repeatedly | Evict pod | N/A | Replace instance |

### Self-Healing Script

`	ypescript
// Health check failure self-healing
async function handleHealthFailure(service: string, failedComponent: string) {
  logger.warn(Health check failure detected, {
    service,
    component: failedComponent,
  });

  // Attempt recovery actions
  switch (failedComponent) {
    case 'database':
      await attemptDatabaseReconnect();
      break;
    case 'redis':
      await attemptRedisReconnect();
      break;
    case 'cloudinary':
      await clearCloudinaryCache();
      break;
    case 'ai_service':
      await restartAIWorkers();
      break;
  }

  // Verify recovery
  const recoveryResult = await checkHealth(service);

  if (recoveryResult.status !== 'ok') {
    // Alert if automatic recovery failed
    await alertOnCall(service, failedComponent, 'Auto-recovery failed');
  }
}
`

---

## Integration with Orchestrator

### Docker Compose Health Checks

`yaml
# docker-compose.yml (development)
version: '3.8'
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - '3000:3000'
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s
`

---

## Alert on Health Check Failure

### Alert Rules

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| service-down | Service liveness probe fails for > 1 minute | CRITICAL | Page on-call, restart service |
| service-degraded | Service readiness probe reports degraded | HIGH | Investigate, check dependencies |
| service-not-ready | Service readiness probe fails for > 2 minutes | HIGH | Remove from load balancer, investigate |
| startup-failure | Service cannot initialize within timeout | CRITICAL | Page on-call, rollback deployment |
| component-down | Any component (db, redis, etc.) reports down | CRITICAL | Page on-call, initiate DR |
| component-degraded | Any component reports degraded | MEDIUM | Investigate component health |
| health-check-latency | Health check response > 1 second | LOW | Investigate slow health endpoint |

### Alert Implementation

`	ypescript
// Health check alerting
async function evaluateHealthAlerts(healthResponse: HealthResponse) {
  const { service, components, status } = healthResponse;

  if (status === 'down') {
    await sendAlert({
      severity: 'CRITICAL',
      title: Service DOWN: ,
      message: Health check returned down status for ,
      data: healthResponse,
      channel: ['pagerduty', 'slack-ops-alerts'],
    });
  }

  if (components) {
    for (const [name, component] of Object.entries(components)) {
      if (component.status === 'down') {
        await sendAlert({
          severity: 'CRITICAL',
          title: Component DOWN:  in ,
          message: Health check for  failed: ,
          data: component,
          channel: ['pagerduty', 'slack-ops-alerts'],
        });
      }
    }
  }
}
`

---

## Health Check Implementation

### NestJS Health Controller

`	ypescript
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  async checkBasic() {
    return this.healthService.getBasicHealth();
  }

  @Get('ready')
  async checkReady() {
    const result = await this.healthService.getReadiness();
    const statusCode = result.status === 'ok' ? 200 : 503;
    return { statusCode, body: result };
  }

  @Get('startup')
  async checkStartup() {
    return this.healthService.getStartupStatus();
  }

  @Get('detailed')
  async checkDetailed() {
    // Only accessible from internal network
    return this.healthService.getDetailedHealth();
  }
}
`

### Python Health Endpoint (AI Pipeline)

`python
from fastapi import APIRouter, HTTPException
from datetime import datetime
import torch
import psutil

router = APIRouter()

@router.get("/health")
async def basic_health():
    return {
        "status": "ok",
        "service": "ai-pipeline",
        "version": "1.3.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/health/ready")
async def readiness():
    components = {
        "gpu": await check_gpu(),
        "model_server": await check_model_server(),
        "redis_queue": await check_redis_queue(),
    }

    overall_status = "ok"
    for comp in components.values():
        if comp["status"] == "down":
            overall_status = "down"
            break
        if comp["status"] == "degraded":
            overall_status = "degraded"

    return {
        "status": overall_status,
        "service": "ai-pipeline",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "components": components,
    }

async def check_gpu():
    if not torch.cuda.is_available():
        return {"status": "down", "error": "CUDA not available"}
    gpu_count = torch.cuda.device_count()
    gpu_name = torch.cuda.get_device_name(0)
    memory_allocated = torch.cuda.memory_allocated(0) / 1024**3
    memory_cached = torch.cuda.memory_reserved(0) / 1024**3
    return {
        "status": "ok",
        "gpu_count": gpu_count,
        "gpu_name": gpu_name,
        "memory_allocated_gb": round(memory_allocated, 2),
        "memory_cached_gb": round(memory_cached, 2),
    }

async def check_model_server():
    try:
        # Ping model server (Triton / TorchServe)
        response = await http_client.get("http://model-server:8001/v2/health/ready")
        return {
            "status": "ok" if response.status_code == 200 else "degraded",
            "latency_ms": response.elapsed.total_seconds() * 1000,
        }
    except Exception as e:
        return {"status": "down", "error": str(e)}

async def check_redis_queue():
    try:
        queue_depth = await redis_client.llen("ai:queue")
        return {
            "status": "ok",
            "queue_depth": queue_depth,
            "warning": None if queue_depth < 100 else "Queue depth > 100",
        }
    except Exception as e:
        return {"status": "down", "error": str(e)}
`

---

## Health Check Dashboard

Grafana dashboard Health Status provides a real-time view of all service health:

`
| Service          | Status    | DB      | Redis   | Cloudinary | AI     | Uptime   |
|-----------------|-----------|---------|---------|------------|--------|----------|
| API Gateway      | OK        | OK (3ms)| OK (1ms)| OK (45ms)  | OK     | 24d 12h  |
| User Service     | OK        | OK (4ms)| OK (1ms)| N/A        | N/A    | 24d 12h  |
| Garment Service  | OK        | OK (3ms)| OK (1ms)| OK (42ms)  | OK     | 24d 12h  |
| Outfit Service   | OK        | OK (5ms)| OK (1ms)| N/A        | OK     | 24d 12h  |
| Storage Service  | DEGRADED  | OK (3ms)| OK (2ms)| OK (120ms) | N/A    | 24d 12h  |
| Real-time Service| OK        | N/A     | OK (1ms)| N/A        | N/A    | 24d 11h  |
| AI Pipeline      | OK        | OK (6ms)| OK (1ms)| N/A        | GPU OK | 24d 12h  |
| Background Workers| OK       | OK (4ms)| OK (1ms)| N/A        | N/A    | 24d 11h  |
`

---

## Health Check SLA

| Metric | Target | Measurement | 
|--------|--------|-------------|
| /health response time (p99) | < 100ms | Request duration |
| /health/ready response time (p99) | < 500ms | Request duration |
| Health check uptime | 100% | Always accessible |
| False positive rate | < 0.1% | Health check incorrectly reports down |
| False negative rate | < 0.1% | Health check misses actual failure |
