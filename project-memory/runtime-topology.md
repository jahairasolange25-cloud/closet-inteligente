# Runtime Topology — Closet Inteligente Digital

> Last Updated: 2026-05-27
> Documents: frontend runtime flow, auth lifecycle, WebSocket lifecycle, upload lifecycle, pipeline lifecycle.

---

## Infrastructure Topology

```
┌──────────────────────────────────────────────────────────────────┐
│  Internet / User Browser                                          │
│  Next.js frontend :3000 (mobile responsive, PWA ready)            │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────▼─────────────────────────────────────────┐
│  NestJS Backend :4000                                             │
│  ├── REST API: /api/v1/*                                          │
│  ├── WebSocket: /ws  (Socket.IO)                                  │
│  ├── Health: /health                                              │
│  ├── Recommendation V2 (ML-assisted ranking + explanations)       │
│  ├── Vector Search (pgvector similarity + semantic search)        │
│  ├── Wardrobe Intelligence (insights, trends, funnels)            │
│  └── Correlation-ID middleware                                    │
│                                                                    │
│  ├── PostgreSQL (pgvector enabled)  :5432                         │
│  │   ├── 39 migrations                                            │
│  │   ├── IVFFlat index on embeddings                              │
│  │   ├── recommendation_feedback, wear_history, metrics tables    │
│  │   └── recommendation_cache for 30-min TTL                      │
│  ├── Redis (ioredis + BullMQ)  :6379                              │
│  └── Cloudinary (external CDN)  HTTPS                             │
│                                                                    │
├────────────────────────┬─────────────────────────────────────────┤
│  Python AI Service :5100                                           │
│  ├── CV Pipeline (rembg, OpenCV, classify)                        │
│  ├── Embedding Service (ResNet50 512-dim)                         │
│  ├── Color Analysis (K-means clustering)                          │
│  └── Semantic Search API                                          │
└──────────────────────────────────────────────────────────────────┘
│  Storage Abstraction Layer (designed)                              │
│  ├── CloudinaryProvider (primary)                                  │
│  └── S3CompatibleProvider (fallback)                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend Runtime Flow

### Cold Start (first page load)

```
1. Next.js SSR renders layout.tsx
2. Providers mount: QueryProvider → AuthProvider → ThemeProvider
3. AuthProvider calls authStore.restoreSession()
   ├── Reads localStorage for access token
   ├── If found: calls authService.getMe() → validates with backend
   ├── Sets isRestoring = false
   └── Router shows content (isRestoring guard prevents flash)
4. BroadcastChannel listener registered (cross-tab logout sync)
5. useSessionExpiration hook starts JWT expiry timer
   └── 2 min before expiry: toast shown + token refresh attempt
6. WebSocket connects if user is authenticated
   └── lib/websocket.ts: socket.connect() with JWT auth
```

### Route Navigation

```
/garments page mounts
  → GarmentsListPage calls useGarments(filters)
    → React Query: fetches GET /api/v1/garments?...
    → QueryClient caches result (staleTime: 2 min)
    → GarmentFilterPanel reads/writes GarmentFilters
  → Loading boundary shows skeleton (loading.tsx)
```

### Optimistic Update Flow

```
User clicks "delete garment"
  → useDeleteGarment.mutate(id)
    → onMutate: removes from QueryClient cache immediately (UI updates)
    → mutationFn: DELETE /api/v1/garments/:id
    → onError: restores snapshot from cache
    → onSettled: invalidateQueries(['garments']) → refetch
```

---

## Auth Lifecycle

```
REGISTER / LOGIN
─────────────────
POST /api/v1/auth/register | login
  → ValidationPipe strips unknown fields
  → AuthService.register | login
    → bcrypt hash / compare
    → JWT sign (access: 15m, refresh: 7d)
    → Returns { user, tokens: { accessToken, refreshToken } }
  → Frontend: stores tokens in localStorage
  → auth-store: set user + isAuthenticated = true

TOKEN REFRESH
─────────────
POST /api/v1/auth/refresh
  → Accepts { refreshToken }
  → AuthService.refresh
    → Verifies JWT_REFRESH_SECRET
    → Issues new accessToken
  → Frontend: lib/api.ts interceptor handles 401
    → Calls authService.refreshAccessToken()
    → Retries original request with new token

LOGOUT
──────
POST /api/v1/auth/logout
  → JwtAuthGuard validates access token
  → RedisService.blacklistToken(jti, ttl)
  → Frontend: clears localStorage + broadcasts logout via BroadcastChannel
  → All tabs: auth-store.logout() → redirects to /login

SESSION EXPIRY WARNING
───────────────────────
useSessionExpiration hook:
  → Parses JWT exp field
  → setTimeout at (exp - 2min)
  → Shows toast: "Tu sesión expira pronto"
  → User can refresh or let it expire
```

---

## WebSocket Lifecycle

```
CONNECT
───────
1. Frontend lib/websocket.ts: socket = io('/ws', { auth: { token: accessToken } })
2. WebSocketGateway.handleConnection
   → Extracts JWT from handshake.auth.token
   → Verifies signature + blacklist check
   → socket.join(`user:${userId}`)
   → socket.join('sync')
3. Frontend: wsStore.setConnected(true)

RECONNECT (token expired scenario)
───────────────────────────────────
socket.on('disconnect') fires
  → Frontend: exponential backoff (1s → 30s, max 30s)
  → Before reconnect: calls refreshAccessToken()
  → Reconnects with fresh token

EVENTS
──────
garment:created  → frontend notification-store.addNotification
garment:updated  → frontend notification-store.addNotification
outfit:created   → frontend notification-store.addNotification
sync:request     → backend broadcasts full garment list to requesting socket
sync:data        → frontend receives and merges data

DISCONNECT
──────────
WebSocketGateway.handleDisconnect
  → socket.leave all rooms (auto)
  → Logs disconnect
```

---

## Upload + Pipeline Lifecycle

```
USER UPLOADS GARMENT IMAGE
──────────────────────────
1. Frontend: AvatarPage | GarmentCreatePage submits FormData
2. POST /api/v1/garments or PUT /api/v1/garments/:id/upload
   → FileMagicPipe validates MIME via magic bytes
   → StorageService.upload → Cloudinary → returns { url, publicId }
   → GarmentsService.create or update: saves image_url to DB
   → PipelineService.startPipeline(uploadId, garmentId, imageUrl)
     → Redis: set pipeline:${uploadId} = PipelineStatus(pending)
     → Redis: set pipeline:garment:${garmentId} = uploadId
     → QueueService.addJob('pipeline', { uploadId })

PIPELINE EXECUTION (BullMQ worker)
───────────────────────────────────
QueueService worker receives job
  → PipelineService.processPipeline(uploadId)
    → Redis: load PipelineStatus
    → status = 'processing'
    → For each step in [background_removal, classification, attribute_extraction, thumbnail]:
      → step.status = 'processing'
      → AIPipelineAdapter.processStep(stepName, garmentId, imageUrl)
        [STUB: SimulatedAIPipelineAdapter — 500–2000ms delay]
        [REAL: HttpAIPipelineAdapter → POST to FastAPI]
      → step.status = 'completed' | 'failed'
      → Save PipelineStatus to Redis
    → status = 'completed'
    → PipelineService.updateGarmentImages (thumbnail URL manipulation)
    → DB: UPDATE garments SET image_url, thumbnail_url

STATUS POLLING
──────────────
GET /api/v1/garments/:id/pipeline-status
  → Redis: get pipeline:garment:${garmentId} → uploadId
  → Redis: get pipeline:${uploadId} → PipelineStatus JSON
  → Returns { status, progress, steps, created_at, updated_at }
```

---

## Export Lifecycle

```
POST /api/v1/export
  → ExportService.createExport
    → Redis: set export:${exportId} = { status: 'pending', ... }
    → [Background async processing]
      → Fetches garments/outfits from DB
      → Generates JSON/CSV payload
      → Cloudinary: upload export file
      → Redis: update status = 'completed', fileUrl
  → Returns { exportId }

GET /api/v1/export/:id/status
  → Redis: get export:${exportId}
  → Returns { status, fileUrl?, progress }
```

---

## Middleware / Guard Execution Order

Every request passes through (in order):

```
1. CorrelationIdMiddleware    — assigns X-Request-ID
2. helmet()                  — security headers
3. RateLimitGuard (global)   — Redis-backed, per-user
4. JwtAuthGuard (per-route)  — validates + blacklist check
5. ValidationPipe            — DTO validation + unknown field stripping
6. AuditLogInterceptor       — logs to DB + Redis
7. Controller method
8. GlobalExceptionFilter     — normalizes error responses
```
