# Deployment

## Overview

Multi-environment deployment configuration for all platform services.

---

## Environment Configuration

### Environment Matrix

| Environment | Frontend URL | API URL | WS URL | Database | Purpose |
|-------------|-------------|---------|--------|----------|---------|
| Development | dev.closetinteligente.com | api.dev.closetinteligente.com | ws.dev.closetinteligente.com | Dev Supabase | Active development |
| Staging | staging.closetinteligente.com | api.staging.closetinteligente.com | ws.staging.closetinteligente.com | Staging Supabase | QA + Integration |
| Production | closetinteligente.com | api.closetinteligente.com | ws.closetinteligente.com | Production Supabase | Live |

---

## Frontend (Vercel)

### vercel.json Configuration

**File:** `frontend/vercel.json`

```json
{
  "name": "closet-inteligente",
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": ".next",
  "regions": ["gru1"],
  "public": false,
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/(.*\\.(webp|png|jpg|jpeg|gif|svg|ico|woff2?|eot|ttf|otf|js|css))",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/_next/image(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.closetinteligente.com/v1/:path*"
    }
  ],
  "redirects": [
    {
      "source": "/closet/prenda/:id",
      "destination": "/closet/:id",
      "permanent": true
    },
    {
      "source": "/outfit/:id",
      "destination": "/outfits/:id",
      "permanent": true
    }
  ]
}
```

### Environment Variables (Vercel)

| Variable | Production | Staging | Development |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.closetinteligente.com/v1` | `https://api.staging.closetinteligente.com/v1` | `https://api.dev.closetinteligente.com/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://api.closetinteligente.com/ws` | `wss://api.staging.closetinteligente.com/ws` | `wss://api.dev.closetinteligente.com/ws` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `closet-inteligente` | `closet-inteligente-staging` | `closet-inteligente-dev` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `closet_prod` | `closet_staging` | `closet_dev` |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | — | — |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...@o...ingest.sentry.io/...` | `https://...@o...ingest.sentry.io/...` | — |

### Vercel Analytics & Monitoring

```typescript
// src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function VercelAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

### Vercel Cron Jobs (Pro plan)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

---

## Backend (Railway)

### railway.json Configuration

**File:** `backend/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 2,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

### Environment Variables (Railway)

| Variable | Production | Staging | Description |
|----------|------------|---------|-------------|
| `NODE_ENV` | `production` | `production` | Environment mode |
| `PORT` | `4000` | `4000` | App port |
| `DATABASE_URL` | `postgresql://...` | `postgresql://...` | Supabase connection |
| `REDIS_HOST` | `redis.internal` | `redis-staging.internal` | Redis host |
| `REDIS_PORT` | `6379` | `6379` | Redis port |
| `JWT_ACCESS_SECRET` | (secret) | (secret) | JWT signing key |
| `JWT_REFRESH_SECRET` | (secret) | (secret) | Refresh signing key |
| `CORS_ORIGIN` | `https://closetinteligente.com` | `https://staging.closetinteligente.com` | Allowed CORS |
| `CLOUDINARY_CLOUD_NAME` | `closet-inteligente` | `closet-inteligente-staging` | Cloudinary |
| `CLOUDINARY_API_KEY` | (secret) | (secret) | Cloudinary key |
| `CLOUDINARY_API_SECRET` | (secret) | (secret) | Cloudinary secret |
| `RPM_API_KEY` | (secret) | (secret) | Ready Player Me key |
| `FCM_SERVER_KEY` | (secret) | (secret) | Firebase key |
| `GOOGLE_DRIVE_CREDENTIALS` | (secret) | (secret) | GDrive JSON |
| `AI_SERVICE_URL` | `http://ai-service:5100` | `http://ai-staging:5100` | AI service |
| `SENTRY_DSN` | `https://...@o...ingest.sentry.io/...` | `https://...@o...ingest.sentry.io/...` | Error tracking |
| `LOG_LEVEL` | `warn` | `info` | Logging detail |

### Railway Service Configuration

```yaml
# Service: closet-backend
# Source: GitHub (main branch)
# Build: Dockerfile
# Port: 4000
# Replicas: 2 (production), 1 (staging)
# Health Check: /health
# Custom Domain: api.closetinteligente.com

# Service: closet-ai
# Source: GitHub (main branch)  
# Build: Dockerfile (services/ai)
# Port: 5100
# Replicas: 1 (GPU instance)
# Health Check: /health
# Custom Domain: ai.closetinteligente.com (internal)

# Service: closet-redis
# Source: Redis Docker image
# Port: 6379
# Plan: Starter (1GB)

# Service: closet-postgres (optional, Supabase external)
# Source: PostgreSQL Docker image
# Port: 5432
# Plan: Standard (2GB)
```

---

## AI Service (Railway GPU)

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### GPU Instance Configuration

| Provider | Plan | GPU | VRAM | Price |
|----------|------|-----|------|-------|
| Railway | GPU Standard | NVIDIA T4 | 16 GB | ~$60/mo |
| Railway | GPU Premium | NVIDIA A10G | 24 GB | ~$120/mo |
| Render | GPU | NVIDIA T4 | 16 GB | ~$0.50/hr |

---

## Domain Configuration

### DNS Records

```dns
; Production
closetinteligente.com         A     76.76.21.21          (Vercel)
www.closetinteligente.com     CNAME cname.vercel-dns.com
api.closetinteligente.com     CNAME closet-backend.up.railway.app
ws.closetinteligente.com      CNAME closet-backend.up.railway.app

; Staging
staging.closetinteligente.com     CNAME cname.vercel-dns.com
api.staging.closetinteligente.com CNAME closet-backend-staging.up.railway.app
ws.staging.closetinteligente.com  CNAME closet-backend-staging.up.railway.app

; Development
dev.closetinteligente.com     CNAME cname.vercel-dns.com
api.dev.closetinteligente.com CNAME closet-backend-dev.up.railway.app
ws.dev.closetinteligente.com  CNAME closet-backend-dev.up.railway.app

; Email
mx.closetinteligente.com      MX 10 aspmx.l.google.com
mx.closetinteligente.com      MX 20 alt1.aspmx.l.google.com

; Verification
_domainconnect.closetinteligente.com TXT domainconnect-verification=...
_dmarc.closetinteligente.com         TXT v=DMARC1; p=quarantine; rua=mailto:dmarc@...
```

### SSL/TLS

```yaml
# Vercel: Automatic SSL (Let's Encrypt)
# Railway: Automatic SSL via Railway Edge
# Custom: Cloudflare (optional)

# Cloudflare SSL configuration:
ssl:
  mode: full (strict)
  minimum_tls_version: 1.3
  early_hints: on
  http2: on
  http3: on
  always_use_https: on
  ssl_recommendation: on
```

---

## CDN Configuration

### Vercel Edge Network

```json
{
  "regions": ["gru1", "iad1", "hkg1"],
  "cdn": {
    "enabled": true,
    "cache": {
      "strategy": "stale-while-revalidate",
      "ttl": 86400
    }
  }
}
```

### Cloudinary CDN

All media assets served via Cloudinary CDN with automatic optimization:
- Automatic format selection (WebP > JPEG > PNG)
- Automatic quality compression (q_auto)
- Responsive image widths
- Lazy loading with blur placeholder

### Cache Configuration

```typescript
// Cloudinary URL transformations
const CLOUDINARY_BASE = 'https://res.cloudinary.com/closet-inteligente';

function getOptimizedImageUrl(publicId: string, width: number): string {
  return `${CLOUDINARY_BASE}/image/upload/c_scale,w_${width},q_auto,f_auto/${publicId}`;
}

function getBlurPlaceholder(publicId: string): string {
  return `${CLOUDINARY_BASE}/image/upload/e_blur:1000,w_30,q_auto/${publicId}`;
}
```

---

## Monitoring Setup

### Sentry (Error Tracking)

```typescript
// frontend/src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Frontend | `/api/health` | `{ status: "ok" }` |
| Backend | `/health` | `{ status: "ok", uptime: 12345, version: "1.0.0" }` |
| AI Service | `/health` | `{ status: "ok", modelsLoaded: ["detector", "classifier"] }` |
| Redis | `PING` | `PONG` |
| PostgreSQL | `SELECT 1` | `1` |

### Uptime Monitoring

```yaml
# Better Uptime / UptimeRobot monitors
monitors:
  - url: https://closetinteligente.com
    interval: 5m
    regions: [US, EU, SA]
    alert: email + slack

  - url: https://api.closetinteligente.com/health
    interval: 1m
    regions: [US, EU, SA]
    alert: email + slack + pagerduty

  - url: https://api.staging.closetinteligente.com/health
    interval: 5m
    regions: [US]
    alert: email
```

### Logging

```yaml
# Railway logs shipped to Axiom or Logtail
logging:
  platform: axiom
  dataset: closet-backend
  endpoints:
    - https://api.axiom.co/v1/datasets/closet-backend/ingest
  filters:
    - level: warn
    - level: error
    - level: info (production only)
```

### Alerts

| Alert | Condition | Channel | Response Time |
|-------|-----------|---------|---------------|
| Service down | Health check fails 3x | Slack + PagerDuty | 5 min |
| High error rate | > 5% 5xx errors in 5 min | Slack | 10 min |
| Slow responses | P95 > 2s in 5 min | Slack | 15 min |
| Database CPU > 80% | CPU utilization | Slack | 15 min |
| Disk space < 20% | Available disk | Slack | 1 hour |
| SSL expiry < 30 days | Certificate days left | Email | Weekly |
