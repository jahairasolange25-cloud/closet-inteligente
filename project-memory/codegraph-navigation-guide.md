# CodeGraph Navigation Guide — Closet Inteligente Digital

> Last Updated: 2026-05-27
> Index: 207 files · 1920 nodes · 3316 edges · 3.56 MB
> Use this guide BEFORE reading any source file. CodeGraph answers structural questions in milliseconds.

---

## Quick Reference — When to Use Which Tool

| Intent | Tool | Example Query |
|---|---|---|
| Find a symbol by name | `codegraph_search` | `"PipelineService"` |
| Understand a feature area | `codegraph_context` | `"garment upload pipeline"` |
| Trace a flow from X to Y | `codegraph_trace` | from `uploadGarment` to `startPipeline` |
| What calls this function? | `codegraph_callers` | `"processJobs"` |
| What does this call? | `codegraph_callees` | `"processPipeline"` |
| Would changing X break Y? | `codegraph_impact` | `"AIPipelineAdapter"` |
| See several symbols' source | `codegraph_explore` | `"PipelineService QueueService ai-pipeline.adapter"` |
| List files in a directory | `codegraph_files` | path: `"backend/src/pipeline"` |

---

## Critical Entry Points

### Backend API Entry Points (47 routes indexed)

| Module | Controller | Route Prefix | Key Methods |
|---|---|---|---|
| Auth | `AuthController` | `/api/v1/auth` | `register`, `login`, `refresh`, `me`, `logout` |
| Garments | `GarmentsController` | `/api/v1/garments` | `create`, `findAll`, `findOne`, `update`, `remove`, `upload`, `triggerPipeline` |
| Outfits | `OutfitsController` | `/api/v1/outfits` | `create`, `findAll`, `findOne`, `update`, `remove`, `recommend` |
| Avatars | `AvatarsController` | `/api/v1/avatars` | `create`, `findOne`, `update`, `versions` |
| Calendar | `CalendarController` | `/api/v1/calendar` | `create`, `getRange`, `update`, `remove` |
| Notifications | `NotificationsController` | `/api/v1/notifications` | `list`, `markRead`, `markAllRead`, `getSettings`, `updateSettings` |
| Analytics | `AnalyticsController` | `/api/v1/analytics` | `garmentStats`, `aiPrecision`, `usage`, `dashboard` |
| Export | `ExportController` | `/api/v1/export` | `request`, `status` |
| Consent | `ConsentController` | `/api/v1/consent` | `get`, `update` |
| Storage | `StorageController` | `/api/v1/storage` | `upload`, `signedUrl`, `delete` |
| Health | `HealthController` | `/health` | `check` |

### Frontend Route Entry Points (17 routes)

| Route | Page Component | Feature Directory |
|---|---|---|
| `/login` | `LoginForm` | `features/auth/` |
| `/register` | `RegisterForm` | `features/auth/` |
| `/` (dashboard) | `DashboardHome` | `features/dashboard/` |
| `/garments` | `GarmentsListPage` | `features/garments/` |
| `/garments/[id]` | `GarmentDetailPage` | `features/garments/` |
| `/garments/new` | `GarmentCreatePage` | `features/garments/` |
| `/outfits` | `OutfitsListPage` | `features/outfits/` |
| `/outfits/[id]` | `OutfitDetailPage` | `features/outfits/` |
| `/outfits/new` | `NewOutfitPage` | `features/outfits/` |
| `/calendar` | `CalendarPage` | `features/calendar/` |
| `/notifications` | `NotificationsPage` | `features/notifications/` |
| `/analytics` | `AnalyticsPage` | `features/analytics/` |
| `/avatar` | `AvatarPage` | `features/avatar/` |
| `/profile` | `ProfilePage` | `features/profile/` |
| `/settings` | `SettingsPage` | `features/settings/` |

---

## Hot Paths (Frequently Traversed)

### Garment Upload → AI Pipeline
```
GarmentsController.uploadGarment
  → StorageService.upload (Cloudinary)
  → GarmentsService.triggerPipeline
    → PipelineService.startPipeline
      → RedisService.set (pipeline:${uploadId})
      → QueueService.addJob('pipeline', { uploadId })
        → [BullMQ worker]
          → PipelineService.processPipeline
            → AIPipelineAdapter.processStep (×4 steps)
            → PipelineService.updateGarmentImages
```

### Auth → JWT Guard → Protected Route
```
Request → CorrelationIdMiddleware → JwtAuthGuard.canActivate
  → verifyToken (JWT secret)
  → RedisService.isTokenBlacklisted
  → sets req.user → Controller
```

### WebSocket Event → Frontend Store
```
WebSocketGateway → emitGarmentCreated
  → Socket.IO namespace '/ws'
    → frontend lib/websocket.ts (socket listener)
      → notification-store.addNotification
        → useNotificationStore subscribers
```

---

## Dependency Hubs (High Fan-In)

These symbols are imported by many others — changes here have wide impact:

| Symbol | Location | Fan-in |
|---|---|---|
| `DATABASE_POOL` | `database/database.module.ts` | 8 services |
| `RedisService` | `redis/redis.service.ts` | 7 modules |
| `AIPipelineAdapter` | `pipeline/ai-pipeline.adapter.ts` | 1 (PipelineService) — by DI token |
| `useAuthStore` | `stores/auth-store.ts` | ~8 components |
| `useUIStore` | `stores/ui-store.ts` | ~6 hooks/components |
| `api` (axios instance) | `lib/api.ts` | All 7 frontend services |
| `extractError` | `lib/api.ts` | All hooks + stores |

---

## Semantic Traversal Strategy

### For "How does auth work?"
```
1. codegraph_context("auth login JWT refresh")
2. codegraph_explore("AuthService AuthController JwtAuthGuard useAuthStore")
```

### For "What happens when a garment is uploaded?"
```
1. codegraph_trace from "uploadGarment" to "processStep"
2. codegraph_explore("PipelineService QueueService AIPipelineAdapter")
```

### For "What would break if I changed the Garment type?"
```
1. codegraph_impact("Garment")  — shows all callers of the interface
2. codegraph_impact("GarmentResponse")  — shows frontend consumers
```

### For "Where does WebSocket state flow to?"
```
1. codegraph_trace from "emitGarmentCreated" to "addNotification"
2. codegraph_callers("addNotification")
```

---

## Module Dependency Graph (Simplified)

```
AppModule
├── DatabaseModule  ← used by 8 services via DATABASE_POOL token
├── RedisModule     ← used by auth, pipeline, export, consent, websocket
├── QueueModule     ← used by pipeline
├── PipelineModule  ← used by garments
│   └── AI_PIPELINE_ADAPTER (SimulatedAIPipelineAdapter → future HttpAIPipelineAdapter)
├── GarmentsModule  ← uses StorageService, PipelineService, RedisService, WebSocketGateway
├── OutfitsModule   ← uses WebSocketGateway
├── AuthModule      ← uses DatabaseModule, RedisService
├── WebSocketModule ← standalone (reads JWT, emits events)
└── ...
```

---

## Stubs and Their Replacement Targets

| Stub | Token / Symbol | Replacement |
|---|---|---|
| `SimulatedAIPipelineAdapter` | `AI_PIPELINE_ADAPTER` | `HttpAIPipelineAdapter` calling FastAPI |
| `recommendOutfits` heuristic | `OutfitsService.recommendOutfits` | ML embeddings via AI service |
| Analytics AI precision | `getAIPrecisionAnalytics` | Real model evaluation data |
| Thumbnail URL manipulation | `updateGarmentImages` | Cloudinary transformation pipeline |

---

## Files NOT in CodeGraph (excluded)

- `backend/node_modules/` — excluded
- `frontend/node_modules/`, `frontend/.next/` — excluded
- `docker-compose.yml` — YAML indexed but not TS
- Migration `.sql` files — not TypeScript
