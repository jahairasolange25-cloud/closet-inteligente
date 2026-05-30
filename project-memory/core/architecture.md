# Closet Inteligente Digital — System Architecture

---

> **REALITY CHECK (2026-05-25):** This document describes the PLANNED architecture.
> Current reality: Backend (NestJS) exists. Frontend, AI service, and 3D pipeline do NOT exist.
> Nginx/Cloudflare reverse proxy does NOT exist. Supabase PostgreSQL is the DB (not a separate PG instance).
> See `PROJECT_REALITY_MATRIX.md` for the authoritative current-state architecture.

## 1. High-Level Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │   Next.js (Web App)  │  │   PWA (Mobile Web)   │  │  Admin Dashboard │   │
│  │  React Three Fiber   │  │  React Three Fiber    │  │  (Next.js)       │   │
│  │  Tailwind CSS        │  │  Tailwind CSS         │  │                  │   │
│  │  Zustand (State)     │  │  Zustand (State)      │  │                  │   │
│  └──────────┬───────────┘  └──────────┬────────────┘  └────────┬─────────┘   │
│             │                          │                       │             │
└─────────────┼──────────────────────────┼───────────────────────┼─────────────┘
              │                          │                       │
              │  HTTPS/WSS               │  HTTPS/WSS           │  HTTPS/WSS
              │                          │                       │
┌─────────────┼──────────────────────────┼───────────────────────┼─────────────┐
│             ▼                          ▼                       ▼             │
│                              API GATEWAY LAYER                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Nginx / Cloudflare (Reverse Proxy)                │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Rate Limiting │ SSL Termination │ WAF │ Request Routing       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│              ┌───────────────┼───────────────┐                               │
│              ▼               ▼               ▼                               │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐              │
│  │  NestJS (API)    │ │  Socket.IO       │ │  Swagger / Docs  │              │
│  │  REST Endpoints  │ │  WebSocket       │ │  OpenAPI 3.0     │              │
│  │  Auth Middleware  │ │  Real-time       │ │                  │              │
│  └────────┬─────────┘ │  Events          │ │                  │              │
│           │           └────────┬─────────┘ └──────────────────┘              │
│           ▼                    ▼                                             │
│                           SERVICE LAYER                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │ Auth        │ │ User        │ │ Garment     │ │ Outfit      │   │  │
│  │  │ Service     │ │ Service     │ │ Service     │ │ Service     │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │ Avatar      │ │ Calendar    │ │ Notification│ │ Analytics   │   │  │
│  │  │ Service     │ │ Service     │ │ Service     │ │ Service     │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │ Sync        │ │ Search      │ │ Export      │ │ AI Gateway  │   │  │
│  │  │ Service     │ │ Service     │ │ Service     │ │ Service     │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│              │                    │                   │                      │
│              ▼                    ▼                   ▼                      │
│                      DATA ACCESS LAYER                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐   │  │
│  │  │  PostgreSQL     │ │  Redis         │ │  Supabase (Auth+Store)│   │  │
│  │  │  (Primary DB)   │ │  (Cache/Sessions)│  │  (Managed Backend)   │   │  │
│  │  └────────────────┘ └────────────────┘ └────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
              │                    │                   │
              ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI / ML MICROSERVICE LAYER                         │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────────────┐  │
│  │  Garment       │  │  Outfit        │  │  Body Measurement            │  │
│  │  Detection     │  │  Recommender   │  │  Estimation                  │  │
│  │  (Detectron2)  │  │  (Transformers)│  │  (Mediapipe + PyTorch)       │  │
│  └────────────────┘  └────────────────┘  └──────────────────────────────┘  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────────────┐  │
│  │  Color Analysis│  │  Fabric        │  │  Style Profile               │  │
│  │  (OpenCV)      │  │  Recognition   │  │  Clustering                  │  │
│  │                 │  │  (PyTorch)    │  │  (Scikit-learn)              │  │
│  └────────────────┘  └────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
              │                    │                   │
              ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          3D RENDERING LAYER                                 │
│                                                                             │
│  ┌────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  React Three Fiber         │  │  Blender (Asset Pipeline)            │  │
│  │  (Runtime 3D Rendering)    │  │  Garment -> GLTF Conversion          │  │
│  │  Three.js / WebGL          │  │  Avatar Rigging                       │  │
│  └────────────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
              │                    │                   │
              ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INTEGRATIONS LAYER                        │
│                                                                             │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────────────────┐  │
│  │Cloudinary│  │ Google     │  │ Firebase  │  │ Third-party            │  │
│  │(Images)  │  │ Drive/Cal  │  │ Cloud     │  │ Resale APIs            │  │
│  │          │  │Auth/Apple  │  │ Messaging │  │ (Vinted, Depop, etc.)  │  │
│  └──────────┘  └────────────┘  └───────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
              │                    │                   │
              ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                               │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Vercel      │  │  Railway /   │  │  GitHub       │  │  Docker       │  │
│  │  (Frontend)  │  │  Render      │  │  Actions      │  │  Container    │  │
│  │              │  │  (Backend)   │  │  (CI/CD)      │  │  Registry     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Interaction Flows

### 2.1 Request Lifecycle (REST)

```
Client                         API Gateway                 NestJS App                    Service                      Database
  │                                │                          │                            │                             │
  │── HTTPS Request ──────────────>│                          │                            │                             │
  │                                │── Rate Limit Check ──────>                            │                             │
  │                                │── JWT Verification ──────>                            │                             │
  │                                │── Route to Controller ───>                            │                             │
  │                                │                          │── Validate DTO ────────────>                             │
  │                                │                          │── Authorize (RBAC) ───────>                             │
  │                                │                          │── Call Service Method ─────>                             │
  │                                │                          │                            │── Query/Write ────────────>│
  │                                │                          │                            │<── Result ─────────────────│
  │                                │                          │<── Return Result ──────────│                             │
  │                                │<── HTTP Response ────────│                             │                             │
  │<── HTTPS Response ─────────────│                          │                            │                             │
```

### 2.2 WebSocket Lifecycle

```
Client                         Socket.IO Server             Redis (Adapter)               NestJS Gateway              Service
  │                                │                            │                             │                         │
  │── WS Connect ─────────────────>│                            │                             │                         │
  │                                │── Authenticate (JWT) ──────>                             │                         │
  │<── Connected ──────────────────│                             │                             │                         │
  │── Subscribe room:user:{id} ────>                            │                             │                         │
  │                                │── Join Room ───────────────>                             │                         │
  │<── Subscribed ────────────────│                             │                             │                         │
  │                                │                            │                             │                         │
  │── WG Event ────────────────────>                            │                             │                         │
  │                                │── Event Handler ─────────────────────────────────────────>                         │
  │                                │                            │                             │── Process Event ────────>│
  │                                │                            │                             │<── Result ──────────────│
  │                                │<── WG Response ──────────────────────────────────────────│                         │
  │<── Event ──────────────────────│                             │                             │                         │
  │                                │                            │                             │                         │
  │                                │                            │                             │── Emit to Room ─────────>│
  │<── Push Notification ──────────│                             │                             │                         │
```

---

## 3. Data Flow Diagrams

### 3.1 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌────────────┐     ┌───────────┐
│  Client  │     │  API Gateway │     │ NestJS   │     │ Supabase   │     │  Redis    │
│          │     │              │     │ Auth     │     │ Auth       │     │  Session  │
│          │     │              │     │ Module   │     │            │     │           │
└────┬─────┘     └──────┬───────┘     └────┬─────┘     └──────┬─────┘     └─────┬─────┘
     │                  │                  │                  │                │
     │  1. POST /auth/register             │                  │                │
     │  {email, password, name}            │                  │                │
     │─────────────────────────────────────>                  │                │
     │                  │                  │                  │                │
     │                  │                  │  2. Validate input               │
     │                  │                  │  (class-validator)               │
     │                  │                  │──────────────────>               │
     │                  │                  │  3. Create user                  │
     │                  │                  │  (hash password)                 │
     │                  │                  │──────────────────────────────────>│
     │                  │                  │  4. User created                 │
     │                  │                  │<──────────────────────────────────│
     │                  │                  │                  │                │
     │                  │                  │  5. Generate JWT                 │
     │                  │                  │  (access + refresh)              │
     │                  │                  │──────────────────────────────────>│
     │                  │                  │                  │  6. Store     │
     │                  │                  │                  │  refresh token│
     │                  │                  │                  │  (7d expiry)  │
     │                  │                  │<──────────────────────────────────│
     │                  │                  │                  │                │
     │  7. 201 Created                     │                  │                │
     │  {user, accessToken, refreshToken}  │                  │                │
     │<────────────────────────────────────│                  │                │
     │                  │                  │                  │                │
     │  8. Store tokens in memory          │                  │                │
     │  (Zustand store)                    │                  │                │
     │                  │                  │                  │                │
     │  9. GET /api/garments               │                  │                │
     │  Authorization: Bearer <accessToken>                  │                │
     │─────────────────────────────────────>                  │                │
     │                  │                  │ 10. Verify JWT                   │
     │                  │                  │──────────────────────────────────>│
     │                  │                  │ 11. Token valid                  │
     │                  │                  │<──────────────────────────────────│
     │                  │                  │ 12. Process request              │
     │                  │                  │  (with user context)             │
```

### 3.2 Garment Pipeline Flow

```
┌──────────┐   ┌──────────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
│  Client  │   │  Cloudinary  │   │ NestJS    │   │  AI       │   │  S3 /    │   │PostgreSQL│
│          │   │              │   │ Garment   │   │  Detection│   │  Local   │   │          │
│          │   │              │   │ Service   │   │  Service  │   │  Storage │   │          │
└────┬─────┘   └──────┬───────┘   └─────┬─────┘   └─────┬─────┘   └────┬─────┘   └────┬─────┘
     │                │                 │               │             │              │
     │ 1. Upload photo│                 │               │             │              │
     │ (multipart)    │                 │               │             │              │
     │──────────────────────────────────>               │             │              │
     │                │                 │               │             │              │
     │                │                 │ 2. Forward to │             │              │
     │                │                 │    Cloudinary │             │              │
     │                │<────────────────│               │             │              │
     │                │                 │               │             │              │
     │                │ 3. Optimize &   │               │             │              │
     │                │    Transform    │               │             │              │
     │                │    (auto-crop,  │               │             │              │
     │                │    quality)     │               │             │              │
     │                │                 │               │             │              │
     │                │ 4. Upload URL   │               │             │              │
     │                │─────────────────>               │             │              │
     │                │                 │               │             │              │
     │                │                 │ 5. Send to AI │             │              │
     │                │                 │   detection   │             │              │
     │                │                 │───────────────>             │              │
     │                │                 │               │             │              │
     │                │                 │               │ 6. Run      │              │
     │                │                 │               │   Detectron2│              │
     │                │                 │               │   inference │              │
     │                │                 │               │             │              │
     │                │                 │               │ 7. AI result │             │
     │                │                 │               │   {type,    │              │
     │                │                 │               │   color,    │              │
     │                │                 │               │   pattern,  │              │
     │                │                 │               │   confidence}              │
     │                │                 │<───────────────│             │              │
     │                │                 │               │             │              │
     │                │                 │ 8. Generate   │             │              │
     │                │                 │   normalized  │             │              │
     │                │                 │   thumbnails  │             │              │
     │                │                 │───────────────>             │              │
     │                │                 │               │             │              │
     │                │                 │               │ 9. Store    │              │
     │                │                 │               │   variants  │              │
     │                │                 │               │────────────>│              │
     │                │                 │               │             │              │
     │                │                 │ 10. Insert    │             │              │
     │                │                 │   garment &   │             │              │
     │                │                 │   attributes  │             │              │
     │                │                 │───────────────────────────────────────────>│
     │                │                 │               │             │              │
     │ 11. Response:  │                 │               │             │              │
     │   garment w/   │                 │               │             │              │
     │   AI tags      │                 │               │             │              │
     │<─────────────────────────────────│               │             │              │
```

### 3.3 Avatar Generation Flow

```
┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────┐
│  Client  │   │ NestJS   │   │  AI Body  │   │  Ready Player│   │  Blender  │   │PostgreSQL│
│          │   │ Avatar   │   │  Measure  │   │  Me API      │   │  Pipeline │   │          │
│          │   │ Service  │   │  (Mediapipe)              │   │           │   │          │
└────┬─────┘   └────┬─────┘   └─────┬─────┘   └──────┬─────┘   └─────┬─────┘   └────┬─────┘
     │              │               │               │              │              │
     │ 1. Body      │               │               │              │              │
     │ measurements │               │               │              │              │
     │ + 2 photos   │               │               │              │              │
     │──────────────>               │               │              │              │
     │              │               │               │              │              │
     │              │ 2. Extract    │               │              │              │
     │              │   body        │               │              │              │
     │              │   measurements│               │              │              │
     │              │──────────────>│               │              │              │
     │              │               │               │              │              │
     │              │               │ 3. AI body    │              │              │
     │              │               │   measurements│              │              │
     │              │               │   (shoulders, │              │              │
     │              │               │   waist, etc) │              │              │
     │              │<──────────────│               │              │              │
     │              │               │               │              │              │
     │              │ 4. Call RPM   │               │              │              │
     │              │   API with    │               │              │              │
     │              │   measurements│               │              │              │
     │              │───────────────               >│              │              │
     │              │               │               │              │              │
     │              │               │               │ 5. Generate  │              │
     │              │               │               │   3D avatar  │              │
     │              │               │               │   GLB file   │              │
     │              │<──────────────│               │              │              │
     │              │               │               │              │              │
     │              │ 6. Process    │               │              │              │
     │              │   avatar      │               │              │              │
     │              │   (optimize,  │               │              │              │
     │              │   compress)   │               │              │              │
     │              │───────────────               >│              │              │
     │              │               │               │              │              │
     │              │               │               │              │ 7. Rigging & │
     │              │               │               │              │   glTF export │
     │              │               │               │<─────────────│              │
     │              │               │               │              │              │
     │              │ 8. Save avatar metadata       │              │              │
     │              │────────────────────────────────────────────────────────────>│
     │              │               │               │              │              │
     │ 9. Avatar    │               │               │              │              │
     │   3D URL +   │               │               │              │              │
     │   metadata   │               │               │              │              │
     │<─────────────│               │               │              │              │
```

### 3.4 Recommendation Flow

```
┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────┐  ┌───────────┐
│  Client  │   │  Calendar    │   │  Weather   │   │  AI Outfit   │   │  Redis   │  │PostgreSQL │
│          │   │  Service     │   │  Service   │   │  Recommender │   │  Cache   │  │           │
└────┬─────┘   └──────┬───────┘   └─────┬──────┘   └──────┬───────┘   └────┬─────┘  └─────┬─────┘
     │                │                 │                │               │             │
     │ 1. Request outfit for today      │                │               │             │
     │───────────────────────────────────────────────────>               │             │
     │                │                 │                │               │             │
     │                │                 │                │ 2. Check cache               │
     │                │                 │                │──────────────>│             │
     │                │                 │                │ 3. Cache miss │             │
     │                │                 │                │<──────────────│             │
     │                │                 │                │               │             │
     │                │ 4. Get events   │                │               │             │
     │                │   for today     │                │               │             │
     │                │─────────────────>               │               │             │
     │                │                 │                │               │             │
     │                │                 │ 5. Get weather │               │             │
     │                │                 │   (lat/lon)    │               │             │
     │                │                 │────────────────>               │             │
     │                │                 │                │               │             │
     │                │                 │ 6. Weather     │               │             │
     │                │                 │   response     │               │             │
     │                │                 │<────────────────│               │             │
     │                │ 7. Event data   │                │               │             │
     │                │<────────────────│                │               │             │
     │                │                 │                │               │             │
     │                │                 │                │ 8. Load user wardrobe       │
     │                │                 │                │─────────────────────────────>│
     │                │                 │                │               │             │
     │                │                 │                │ 9. Load style profile       │
     │                │                 │                │─────────────────────────────>│
     │                │                 │                │               │             │
     │                │                 │                │ 10. Feature encoding        │
     │                │                 │                │  (garment vectors)          │
     │                │                 │                │               │             │
     │                │                 │                │ 11. Run ranking model       │
     │                │                 │                │  (Transformer: context ->   │
     │                │                 │                │   outfit scoring)           │
     │                │                 │                │               │             │
     │                │                 │                │ 12. Top-3 outfits           │
     │                │                 │                │               │             │
     │                │                 │                │ 13. Cache result            │
     │                │                 │                │  (TTL: 30 min)              │
     │                │                 │                │──────────────>│             │
     │                │                 │                │               │             │
     │ 14. Response:  │                 │                │               │             │
     │  3 outfits w/  │                 │                │               │             │
     │  garment list  │                 │                │               │             │
     │<─────────────────────────────────────────────────│               │             │
```

### 3.5 Sync Flow

```
┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────┐   ┌────────────┐
│  Client  │   │  Sync        │   │  Conflict  │   │  Local   │   │  Remote    │
│ (Offline)│   │  Service     │   │  Resolver  │   │  IndexDB │   │  Server    │
└────┬─────┘   └──────┬───────┘   └─────┬──────┘   └────┬─────┘   └─────┬──────┘
     │                │                 │              │             │
     │── Offline ──────                 │              │             │
     │                │                 │              │             │
     │ 1. User creates garment          │              │             │
     │  (offline)      │                 │              │             │
     │──────────────────────────────────────────────> │             │
     │                │                 │              │             │
     │ 2. Write to    │                 │              │             │
     │  local queue   │                 │              │             │
     │  {action:      │                 │              │             │
     │   "CREATE",    │                 │              │             │
     │   entity:      │                 │              │             │
     │   "garment",   │                 │              │             │
     │   id: "local_1",                │              │             │
     │   data: {...},  │               │              │             │
     │   timestamp}   │                 │              │             │
     │                │                 │              │             │
     │── Online ──────│                 │              │             │
     │                │                 │              │             │
     │ 3. Trigger sync │                │              │             │
     │─────────────────>               │              │             │
     │                │                 │              │             │
     │                │ 4. Get pending  │              │             │
     │                │   operations    │              │             │
     │                │──────────────────────────────>│             │
     │                │                 │              │             │
     │                │ 5. Send to      │              │             │
     │                │   server        │              │             │
     │                │───────────────────────────────────────────>│
     │                │                 │              │             │
     │                │                 │              │  6. Process │
     │                │                 │              │    each op  │
     │                │                 │              │    in order │
     │                │                 │              │             │
     │                │                 │  7. Conflict? │            │
     │                │                 │<──────────────│             │
     │                │                 │              │             │
     │                │                 │  8. If conflict: │          │
     │                │                 │  - Compare timestamps       │
     │                │                 │  - Last-write-wins          │
     │                │                 │  - Log conflict             │
     │                │                 │              │             │
     │                │                 │  9. Resolved  │             │
     │                │                 │──────────────>│             │
     │                │                 │              │             │
     │                │ 10. Server response             │             │
     │                │  {applied: [...],               │             │
     │                │   conflicts: [...]}             │             │
     │                │<────────────────────────────────────────────│
     │                │                 │              │             │
     │                │ 11. Update local                │             │
     │                │   with server state              │            │
     │                │──────────────────────────────>│             │
     │                │                 │              │             │
     │                │ 12. Clear applied               │             │
     │                │   operations    │              │             │
     │                │──────────────────────────────>│             │
     │                │                 │              │             │
     │ 13. Sync complete                │              │             │
     │<────────────────│                 │              │             │
```

### 3.6 Notification Flow

```
┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────┐
│  Client  │   │  NestJS      │   │  FCM       │   │  Redis   │   │  Schedule    │
│ (Browser)│   │  Notification│   │  (Firebase)│   │  Queue   │   │  (node-cron) │
└────┬─────┘   └──────┬───────┘   └─────┬──────┘   └────┬─────┘   └──────┬───────┘
     │                │                 │              │              │
     │                │                 │              │              │
     │                │ 1. Cron trigger │              │              │
     │                │   "daily outfit │              │              │
     │                │    suggestion"  │              │              │
     │                │<──────────────────────────────────────────────│
     │                │                 │              │              │
     │                │ 2. Enqueue      │              │              │
     │                │   notification  │              │              │
     │                │   job           │              │              │
     │                │───────────────────────────────>│              │
     │                │                 │              │              │
     │                │ 3. Process      │              │              │
     │                │   notification  │              │              │
     │                │   worker picks  │              │              │
     │                │   up job        │              │              │
     │                │<───────────────────────────────│              │
     │                │                 │              │              │
     │                │ 4. Build        │              │              │
     │                │   notification  │              │              │
     │                │   payload       │              │              │
     │                │                 │              │              │
     │                │ 5. Save to DB   │              │              │
     │                │─────────────────────────────────────────────────
     │                │                 │              │              │
     │                │ 6. Send push    │              │              │
     │                │─────────────────>              │              │
     │                │                 │              │              │
     │                │                 │ 7. FCM push  │              │
     │                │                 │   to device  │              │
     │<─── Push notification ──────────│              │              │
     │                │                 │              │              │
     │ 8. User opens  │                 │              │              │
     │   notification │                 │              │              │
     │─────────────────>                │              │              │
     │                │                 │              │              │
     │                │ 9. Mark as read │              │              │
     │                │─────────────────────────────────────────────────
     │                │                 │              │              │
```

### 3.7 Analytics Flow

```
┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────┐
│  Client  │   │  NestJS      │   │  Analytics │   │  Kafka/  │   │  Data        │
│ / Server │   │  Events      │   │  Validator │   │  Redis   │   │  Warehouse   │
│          │   │  Emitter     │   │            │   │  Stream  │   │  (PostgreSQL)│
└────┬─────┘   └──────┬───────┘   └─────┬──────┘   └────┬─────┘   └──────┬───────┘
     │                │                 │              │              │
     │ 1. User action  │                 │              │              │
     │  (view garment) │                 │              │              │
     │─────────────────>                │              │              │
     │                │                 │              │              │
     │                │ 2. Create event │              │              │
     │                │  {              │              │              │
     │                │   name:         │              │              │
     │                │   "garment.view",             │              │
     │                │   userId,       │              │              │
     │                │   metadata: {   │              │              │
     │                │    garmentId,   │              │              │
     │                │    timestamp,   │              │              │
     │                │    sessionId    │              │              │
     │                │   },            │              │              │
     │                │   device,       │              │              │
     │                │   ip            │              │              │
     │                │  }              │              │              │
     │                │                 │              │              │
     │                │ 3. Validate     │              │              │
     │                │   event schema  │              │              │
     │                │─────────────────>              │              │
     │                │                 │              │              │
     │                │ 4. Valid event  │              │              │
     │                │<────────────────│              │              │
     │                │                 │              │              │
     │                │ 5. Enqueue event               │              │
     │                │───────────────────────────────>│              │
     │                │                 │              │              │
     │                │                 │              │ 6. Batch     │
     │                │                 │              │   (every 60s)│
     │                │                 │              │──────────────>│
     │                │                 │              │              │
     │                │                 │              │              │ 7. INSERT INTO
     │                │                 │              │              │   analytics_events
     │                │                 │              │              │   (1000/batch)
```

---

## 4. Security Architecture

### 4.1 Authentication & Authorization

| Mechanism | Implementation |
|---|---|
| Password Hashing | bcrypt (cost factor 12) |
| JWT Access Token | RS256, 15-minute expiry |
| JWT Refresh Token | 7-day expiry, stored in Redis |
| MFA | TOTP (authenticator app) or SMS backup codes |
| OAuth 2.0 | Google, Apple (PKCE flow) |
| RBAC | Roles: user, moderator, admin, superadmin |
| Session Management | Redis with automatic cleanup |
| API Key (Machine) | HMAC-signed, per-service keys |

### 4.2 Data Protection

| Layer | Measure |
|---|---|
| Transport | TLS 1.3 (min), HSTS, Perfect Forward Secrecy |
| Database | AES-256 at rest (PostgreSQL TDE) |
| PII Columns | pgcrypto column-level encryption for email, phone, address |
| Backups | Encrypted (GPG) before transfer to cold storage |
| Body Measurements | Encrypted at rest; only decrypted for 3D rendering session |
| Media Files | Cloudinary signed URLs with expiry; access control per user |

### 4.3 API Security

| Measure | Implementation |
|---|---|
| Rate Limiting | 100 req/min per user (Nginx + Redis sliding window) |
| CORS | Whitelist of allowed origins only |
| CSRF | Double-submit cookie pattern |
| Input Validation | class-validator DTOs; whitelist: true |
| SQL Injection | Parameterized queries via TypeORM |
| XSS | Helmet.js headers; Content-Security-Policy |
| IDOR Prevention | Resource ownership check on every request |
| Request Size Limit | 10MB (JSON), 50MB (multipart) |

### 4.4 Network Security

- All services in private VPC except API gateway
- Database accessible only via bastion host or internal network
- Redis with password + TLS
- Microservice-to-microservice communication via mTLS
- WAF rules blocking SQLi, XSS, path traversal

### 4.5 Audit Trail

- All state-changing operations logged in `audit_logs` table
- Cannot be deleted or modified (append-only)
- Includes: actor, action, resource, old/new values, IP, user-agent
- Retained for minimum 1 year

---

## 5. Scalability Design

### 5.1 Horizontal Scaling Strategy

| Component | Scaling Method | Max Instances |
|---|---|---|
| NestJS API | Stateless; scale horizontally behind load balancer | 10 |
| Socket.IO | Sticky sessions + Redis adapter | 5 |
| AI Microservice | GPU-backed; queue-based; auto-scale | 3 |
| PostgreSQL | Read replicas (3); write master | 1 primary + 3 replicas |
| Redis | Cluster mode with sharding | 3 nodes |

### 5.2 Caching Strategy

| Cache | What | TTL | Invalidation |
|---|---|---|---|
| Redis (App) | User sessions | 7 days | On logout / password change |
| Redis (App) | Outfit recommendations | 30 min | On garment add/remove |
| Redis (App) | Weather data | 1 hour | TTL expiry |
| Redis (App) | User wardrobe list | 5 min | On garment change |
| CDN (Cloudinary) | Garment images | 30 days | URL versioning |
| CDN (Vercel) | Static assets | 1 year | Build hash |
| Browser | API responses (SWR) | Stale-while-revalidate | TTL + mutation |
| Browser | 3D models (IndexedDB) | Until eviction | Manual clear |

### 5.3 Database Scaling

- **Read replicas**: All read queries go to replicas; writes go to primary
- **Connection pooling**: PgBouncer (transaction mode) between app and DB
- **Partitioning**: `analytics_events` and `audit_logs` partitioned by month
- **Indexing**: All foreign keys and frequent query columns indexed
- **Archival**: Records older than 12 months moved to cold storage (Parquet on S3)
- **Vacuum**: `autovacuum` tuned for high-write tables

### 5.4 Queue / Async Processing

| Queue | Purpose | Backend | Workers |
|---|---|---|---|
| AI Detection | Garment photo processing | BullMQ (Redis) | 3 |
| Avatar Generation | 3D model creation | BullMQ (Redis) | 2 |
| Notification Dispatch | Push/email sending | BullMQ (Redis) | 2 |
| Analytics Ingestion | Batch event writing | BullMQ (Redis) | 2 |
| Image Optimization | Thumbnail generation | BullMQ (Redis) | 2 |
| Sync Processing | Offline operation merge | BullMQ (Redis) | 3 |

---

## 6. Technology Decisions & Rationale

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Frontend Framework | Next.js | Create React App, Remix, SvelteKit | SSR/SSG hybrid, file-based routing, Vercel integration, large ecosystem |
| UI State | Zustand | Redux, Jotai, Recoil | Minimal boilerplate, excellent TS support, small bundle (~1KB) |
| Server State | TanStack Query (React Query) | SWR, Apollo | Robust caching, pagination, stale-while-revalidate, devtools |
| 3D Rendering | React Three Fiber | pure Three.js, Babylon.js, Unity | React-native 3D, declarative scene graph, Three.js ecosystem |
| Backend Framework | NestJS | Express, Fastify, Koa | Opinionated architecture, dependency injection, TypeORM + GraphQL support |
| ORM | TypeORM | Prisma, Drizzle, Knex | Mature NestJS integration, migration system, active record + data mapper |
| Database | PostgreSQL | MySQL, MongoDB, MariaDB | ACID compliance, JSON support, PostGIS for geo, Supabase compatibility |
| BaaS | Supabase | Firebase, Appwrite, custom | PostgreSQL-based, Row Level Security, real-time subscriptions, auth |
| Cache | Redis (ioredis) | Memcached, Dragonfly | Pub/Sub for Socket.IO, BullMQ queues, session store, TTL |
| Real-time | Socket.IO | raw WebSocket, Pusher, Ably | Auto-reconnect, room support, Redis adapter for scaling |
| AI Framework | PyTorch | TensorFlow, JAX, ONNX | Research ecosystem, Detectron2/PyTorchVision, dynamic computation graphs |
| Object Detection | Detectron2 | YOLOv8, MMDetection, TensorFlow Object Detection | Accurate, well-documented, Facebook AI Research, configurable |
| Pose/Measure | Mediapipe | OpenPose, MoveNet | On-device capable, lightweight, good body landmark quality |
| NLP/Recs | Hugging Face Transformers | spaCy, NLTK, custom | Pre-trained models, fine-tuning for style, multi-language |
| Image Processing | OpenCV | Pillow, scikit-image, imageio | Extensive filter library, color analysis, histogram matching |
| Image Hosting | Cloudinary | imgix, Cloudflare Images, S3+Sharp | Built-in transformations, CDN, AI tagging, face detection |
| File Storage | Cloudinary + Google Drive | S3 only, Firebase Storage | Dual strategy: CDN for access, Drive for backup |
| Image Processing (Server) | Sharp | ImageMagick, jimp | Fast, memory-efficient, streaming support |
| Push Notifications | Firebase Cloud Messaging | OneSignal, AWS SNS | Free tier, reliable delivery, topic support |
| CI/CD | GitHub Actions | CircleCI, Jenkins, GitLab CI | Tight GitHub integration, marketplace actions, free tier |
| Frontend Hosting | Vercel | Netlify, AWS Amplify | Next.js-native, preview deployments, edge functions |
| Backend Hosting | Railway / Render | Heroku, AWS ECS, Fly.io | Simple deployment, good EU region, managed Postgres |
| Containerization | Docker | None (bare metal), Podman | Industry standard, reproducible environments |
| 3D Authoring | Blender | Maya, C4D, 3DS Max | Open source, Python scripting, glTF export, large community |
| Avatar System | Ready Player Me | custom avatars, Avatar SDK, VRoid | Cross-platform, body measurement input, GLB output |
| Calendar | Google Calendar API | Outlook Calendar, iCal | Ubiquitous, well-documented, free tier |

---

## 7. Deployment Architecture

### Environment Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│  Environment     │  URL                        │  PostgreSQL    │
├──────────────────┼─────────────────────────────┼────────────────┤
│  Local           │  http://localhost:3000       │  Docker local  │
│  Development     │  dev.closetinteligente.com   │  Dev instance  │
│  Staging         │  staging.closetinteligente.com│  Staging       │
│  Production      │  closetinteligente.com       │  Production    │
└──────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
Git Push → GitHub Actions → Lint → Test → Build → Docker Tag
  → Deploy to Vercel (Frontend)
  → Deploy to Railway (Backend)
  → Run Migrations
  → Smoke Tests
  → Rollback on Failure
```

### Monitoring & Observability

| Tool | Purpose |
|---|---|
| Sentry | Error tracking (frontend + backend) |
| Grafana + Prometheus | Metrics dashboards |
| Datadog / New Relic | APM (Phase 2) |
| Logtail / Loki | Centralized logging |
| Uptime Robot | External uptime monitoring |
| Sentry Performance | Frontend performance tracing |

---

## 8. Disaster Recovery

### RTO / RPO Targets

| Severity | RTO | RPO |
|---|---|---|
| Critical (DB loss) | 4 hours | 1 hour |
| High (Service down) | 2 hours | N/A |
| Medium (Feature degraded) | 24 hours | N/A |

### Backup Strategy

- PostgreSQL: pg_dump every 6 hours + WAL streaming (point-in-time recovery)
- Redis: RDB snapshots every hour + AOF append-only log
- Media: Cloudinary has built-in redundancy; Drive backup nightly
- Configuration: All infra-as-code in Git; secrets in GitHub Encrypted Secrets

### Recovery Steps

1. Provision new DB instance from latest backup
2. Restore WAL to point of failure
3. Update connection strings in environment
4. Redeploy API services
5. Verify data integrity
6. Switch DNS if needed
7. Post-mortem
