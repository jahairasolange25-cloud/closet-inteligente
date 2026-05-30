# Closet Inteligente Digital — Technology Stack (Frozen)

---

> **REALITY CHECK (2026-05-25):** This document describes the PLANNED stack.
> Only the Backend section reflects actual implemented code. Frontend and AI sections are plans.
> Critical correction: Backend ORM is listed as **Prisma** — **WRONG**. Actual: raw `pg` driver (no ORM). See ADR-015.
> Auth provider listed as Auth0 in some sections — **WRONG**. Actual: Supabase JWT. See ADR-010.

> **IMPORTANT**: This document defines the EXACT, FROZEN technology stack for the Closet Inteligente Digital platform. No technology substitution is permitted without a formal architecture review and Tech Lead approval. This is a living document but changes require a RFC (Request for Comments) process.

---

## 1. Frontend

### 1.1 Core Framework

| Field | Value |
|---|---|
| Technology | **Next.js** |
| Version | **14.2.x** (LTS) |
| Minimum | 14.2.0 |
| Maximum | 14.x.x (major version locked) |
| Render Strategy | App Router with React Server Components (RSC) |
| Features | SSR, SSG, ISR, Middleware, Route Handlers |
| Package | `next@^14.2.0` |
| Justification | Industry-standard React framework with hybrid rendering, excellent developer experience, tight Vercel integration, and the largest React ecosystem. App Router provides RSC for optimal performance. |
| Prohibited Alternatives | Remix, SvelteKit, Nuxt.js, Gatsby, Create React App, Astro (for this project) |

### 1.2 UI Language

| Field | Value |
|---|---|
| Technology | **React** |
| Version | **18.3.x** |
| Minimum | 18.3.0 |
| Maximum | 18.x.x |
| Features | Hooks, Suspense, Concurrent Features, Server Components |
| Package | `react@^18.3.0`, `react-dom@^18.3.0` |
| Justification | The most widely adopted UI library with unparalleled ecosystem, community, and tooling. Required by Next.js. |
| Prohibited Alternatives | Vue 3, Svelte 5, SolidJS, Preact, Angular |

### 1.3 Language

| Field | Value |
|---|---|
| Technology | **TypeScript** |
| Version | **5.4.x** |
| Minimum | 5.4.0 |
| Maximum | 5.x.x |
| Compiler Options | `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` |
| Package | `typescript@^5.4.0` |
| Justification | Type safety, developer tooling, self-documenting code, catch errors at compile time. Strict mode prevents entire categories of bugs. |
| Prohibited Alternatives | JavaScript (without TypeScript), Flow, ReasonML |

### 1.4 Styling

| Field | Value |
|---|---|
| Technology | **Tailwind CSS** |
| Version | **3.4.x** |
| Minimum | 3.4.0 |
| Maximum | 3.x.x |
| Features | JIT compilation, arbitrary values, `@apply` for component extraction |
| Package | `tailwindcss@^3.4.0`, `postcss@^8.4.0`, `autoprefixer@^10.4.0` |
| Justification | Utility-first approach eliminates CSS specificity wars, produces minimal CSS in production, enables rapid prototyping, great with React components. |
| Prohibited Alternatives | styled-components, CSS Modules, Sass (as primary system), Bootstrap, Material UI CSS, Chakra UI's built-in styling |

### 1.5 Client State Management

| Field | Value |
|---|---|
| Technology | **Zustand** |
| Version | **4.5.x** |
| Minimum | 4.5.0 |
| Maximum | 4.x.x |
| Package | `zustand@^4.5.0` |
| Justification | Minimal boilerplate, excellent TypeScript support, tiny bundle (~1KB), middleware support (persist, immer, devtools), no provider wrapping needed. |
| Prohibited Alternatives | Redux (vanilla), Redux Toolkit, MobX, Jotai, Recoil, Valtio, Pinia |

### 1.6 Server State / Data Fetching

| Field | Value |
|---|---|
| Technology | **TanStack Query (React Query)** |
| Version | **5.x** (latest stable) |
| Minimum | 5.28.0 |
| Maximum | 5.x.x |
| Package | `@tanstack/react-query@^5.28.0` |
| Features | Caching, stale-while-revalidate, pagination, infinite queries, mutations, optimistic updates |
| Justification | Robust server state management with automatic caching, deduplication, background refetching, and devtools. Handles all server synchronization concerns. |
| Prohibited Alternatives | SWR, Apollo Client (for GraphQL), RTK Query, plain `fetch` with `useEffect` |

### 1.7 3D Rendering

| Field | Value |
|---|---|
| Technology | **React Three Fiber (R3F)** |
| Version | **8.15.x** |
| Minimum | 8.15.0 |
| Maximum | 8.x.x |
| Additional | `@react-three/drei@^9.88.0`, `@react-three/postprocessing@^2.16.0`, `@react-three/fiber@^8.15.0` |
| Package | `@react-three/fiber@^8.15.0` |
| Justification | Declarative React components for Three.js, enabling 3D rendering with React paradigms. Drei provides essential helpers (OrbitControls, Environment, Loader). |
| Prohibited Alternatives | pure Three.js (too imperative), Babylon.js, PlayCanvas, Unity WebGL, A-Frame |

### 1.8 3D Engine (Underlying)

| Field | Value |
|---|---|
| Technology | **Three.js** |
| Version | **0.162.x** |
| Minimum | 0.162.0 |
| Maximum | 0.x.x |
| Package | `three@^0.162.0` |
| Justification | The most mature WebGL library, extensive examples, large community, R3F dependency. |
| Prohibited Alternatives | Babylon.js, PlayCanvas, Deck.gl |

---

## 2. Backend

### 2.1 Backend Framework

| Field | Value |
|---|---|
| Technology | **NestJS** |
| Version | **10.3.x** |
| Minimum | 10.3.0 |
| Maximum | 10.x.x |
| Features | Modules, Controllers, Providers, Guards, Interceptors, Pipes, Filters, Decorators |
| Package | `@nestjs/core@^10.3.0`, `@nestjs/common@^10.3.0`, `@nestjs/platform-express@^10.3.0` |
| Justification | Opinionated, modular architecture inspired by Angular. Built-in dependency injection, guards, interceptors, pipes. Excellent TypeORM support. Consistent structure across all microservices. |
| Prohibited Alternatives | Express (raw), Fastify, Koa, Hapi, AdonisJS, FoalTS |

### 2.2 Runtime

| Field | Value |
|---|---|
| Technology | **Node.js** |
| Version | **20.x LTS** (Iron) |
| Minimum | 20.11.0 |
| Maximum | 20.x.x |
| Package | N/A (runtime) |
| Justification | LTS stability, long-term support until April 2026, V8 engine improvements, built-in fetch, test runner. |
| Prohibited Alternatives | Deno, Bun (experimental — not for production), Node.js 18 or 22+ (until LTS confirmed) |

### 2.3 API Documentation

| Field | Value |
|---|---|
| Technology | **Swagger / OpenAPI** |
| Version | 3.x |
| Package | `@nestjs/swagger@^7.2.0` |
| Justification | Auto-generated API docs from NestJS decorators, interactive Swagger UI, OpenAPI 3.0 compliant. |
| Prohibited Alternatives | Postman (docs generation), Stoplight, Redoc (as alternative viewer allowed but must derive from OpenAPI spec) |

### 2.4 Validation

| Field | Value |
|---|---|
| Technology | **class-validator + class-transformer** |
| Version | `class-validator@^0.14.0`, `class-transformer@^0.5.0` |
| Package | `class-validator@^0.14.0`, `class-transformer@^0.5.0` |
| Justification | Decorator-based validation on DTOs, integrates seamlessly with NestJS ValidationPipe. |
| Prohibited Alternatives | Joi, Zod (on backend — allowed on frontend), Yup |

---

## 3. Database & Storage

### 3.1 Primary Database

| Field | Value |
|---|---|
| Technology | **PostgreSQL** |
| Version | **16.x** |
| Minimum | 16.0 |
| Maximum | 16.x |
| Hosting | Supabase (primary) + Local Docker (development) |
| Justification | ACID compliance, JSONB for flexible attributes, excellent extension ecosystem (PostGIS, pgcrypto, pgvector), Row-Level Security, mature replication. Supabase provides managed Postgres + Auth + Storage + Realtime. |
| Prohibited Alternatives | MySQL 8, MariaDB, MongoDB, SQLite, CockroachDB |

### 3.2 Backend-as-a-Service

| Field | Value |
|---|---|
| Technology | **Supabase** |
| Version | Latest (cloud-managed) |
| Features | PostgreSQL, Auth (GoTrue), Storage (S3-compatible), Realtime subscriptions, Edge Functions |
| Service | Managed cloud (supabase.com) |
| Justification | Provides managed PostgreSQL, built-in authentication with Row-Level Security, file storage, and real-time subscriptions. Open-source and self-hostable as fallback. |
| Prohibited Alternatives | Firebase (Firestore is NoSQL), Appwrite, PocketBase, custom Auth0 + Postgres |

### 3.3 Object-Relational Mapper

| Field | Value |
|---|---|
| Technology | **TypeORM** |
| Version | **0.3.x** |
| Minimum | 0.3.20 |
| Maximum | 0.3.x |
| Features | Decorator-based entities, migrations, relations, query builder, DataSource |
| Package | `typeorm@^0.3.20`, `@nestjs/typeorm@^10.0.0` |
| Justification | First-class NestJS support via `@nestjs/typeorm`, decorator-based entity definition, migration system, wide PostgreSQL support. |
| Prohibited Alternatives | Prisma, Drizzle ORM, Knex, Sequelize, MikroORM |

### 3.4 Cache / Session Store

| Field | Value |
|---|---|
| Technology | **Redis** |
| Version | **7.2.x** |
| Client | **ioredis** |
| Node Package | `ioredis@^5.3.0` |
| Features | Session storage, cache, BullMQ queue backend, Socket.IO adapter, rate limiting |
| Justification | In-memory data structure store with persistence options. Used for caching, session management, pub/sub, and job queues. ioredis is the most robust Node.js Redis client. |
| Prohibited Alternatives | Memcached (no pub/sub, no queues), Dragonfly (too new), KeyDB (allowed as drop-in but not preferred) |

### 3.5 Job Queue

| Field | Value |
|---|---|
| Technology | **BullMQ** |
| Version | **5.x** |
| Minimum | 5.2.0 |
| Maximum | 5.x.x |
| Package | `bullmq@^5.2.0` |
| Justification | Redis-backed job queue with scheduling, retries, rate limiting, and worker pools. GraphQL dashboard available. |
| Prohibited Alternatives | RabbitMQ (too heavy for this scale), AWS SQS (vendor lock-in), Agenda (fewer features), Bee-Queue |

---

## 4. Real-Time Communication

| Field | Value |
|---|---|
| Technology | **Socket.IO** |
| Version | **4.7.x** |
| Minimum | 4.7.0 |
| Maximum | 4.x.x |
| Package | `socket.io@^4.7.0`, `@nestjs/platform-socket.io@^10.3.0`, `socket.io-client@^4.7.0` |
| Adapter | `@socket.io/redis-adapter@^8.2.0` |
| Justification | Auto-reconnect, room support, fallback to long-polling, Redis adapter for horizontal scaling, mature NestJS integration. |
| Prohibited Alternatives | raw WebSocket, Pusher (vendor lock-in), Ably (costly), Server-Sent Events (one-way only) |

---

## 5. AI / Machine Learning

### 5.1 AI Language

| Field | Value |
|---|---|
| Technology | **Python** |
| Version | **3.11.x** |
| Minimum | 3.11.0 |
| Maximum | 3.11.x |
| Justification | Dominant language for ML/AI, extensive library ecosystem (PyTorch, OpenCV, scikit-learn, Transformers). 3.11 offers performance improvements over 3.10. |
| Prohibited Alternatives | Python 3.12+ (library compatibility not guaranteed), Python 3.10 (older), R, Julia |

### 5.2 Deep Learning Framework

| Field | Value |
|---|---|
| Technology | **PyTorch** |
| Version | **2.2.x** |
| Minimum | 2.2.0 |
| Maximum | 2.x.x |
| Package | `torch@^2.2.0` |
| Features | Dynamic computation graphs, TorchScript, torch.compile, CUDA support, distributed training |
| Justification | Research-first framework, Detectron2 depends on it, Hugging Face Transformers optimized for PyTorch, dynamic graphs for flexible model architecture. |
| Prohibited Alternatives | TensorFlow 2.x, JAX, MXNet, Caffe2, Chainer |

### 5.3 Computer Vision — Detection

| Field | Value |
|---|---|
| Technology | **Detectron2** |
| Version | **0.6** (latest) |
| Package | `detectron2@^0.6` (from Facebook Research) |
| Features | Mask R-CNN, Keypoint R-CNN, DensePose, panoptic segmentation |
| Justification | State-of-the-art object detection and instance segmentation, pre-trained models for fashion items, Facebook AI Research. |
| Prohibited Alternatives | YOLOv8 (allowed for real-time inference only if Detectron2 is insufficient), MMDetection, TensorFlow Object Detection API |

### 5.4 Computer Vision — Utilities

| Field | Value |
|---|---|
| Technology | **OpenCV** |
| Version | **4.9.x** |
| Package | `opencv-python@^4.9.0` |
| Features | Color analysis, histogram matching, image preprocessing, edge detection, contour finding |
| Justification | Most comprehensive computer vision library, essential for image preprocessing and color analysis pipeline. |
| Prohibited Alternatives | Pillow only (insufficient for advanced CV), scikit-image, imageio |

### 5.5 Body Pose / Measurement

| Field | Value |
|---|---|
| Technology | **Mediapipe** |
| Version | **0.10.x** |
| Package | `mediapipe@^0.10.0` |
| Features | Pose landmark detection, body mesh, on-device inference |
| Justification | Lightweight, cross-platform, excellent body landmark detection (33 landmarks), on-device capable for privacy-preserving measurement. |
| Prohibited Alternatives | OpenPose (heavier, harder to deploy), MoveNet (TensorFlow dependency) |

### 5.6 NLP / Transformers

| Field | Value |
|---|---|
| Technology | **Hugging Face Transformers** |
| Version | **4.38.x** |
| Package | `transformers@^4.38.0` |
| Features | Pre-trained models, fine-tuning API, pipeline API, multi-language support |
| Justification | Largest model hub, pre-trained fashion classifiers, zero-shot classification for garment attributes, multi-language style descriptions. |
| Prohibited Alternatives | spaCy (classical NLP only), NLTK, Stanford CoreNLP, BERT-as-service |

### 5.7 Additional ML Tools

| Technology | Version | Purpose |
|---|---|---|
| scikit-learn | `^1.4.0` | Clustering (style profiles), dimensionality reduction, feature engineering |
| pandas | `^2.2.0` | Data manipulation, feature extraction, dataset management |
| numpy | `^1.26.0` | Numerical computing, array operations |
| Pillow | `^10.2.0` | Image loading, basic manipulation |
| onnxruntime | `^1.17.0` | Model export and optimized inference (Phase 2) |
| Triton Inference Server | `24.01` | Production model serving (Phase 3) |

---

## 6. 3D & Graphics

### 6.1 Runtime Rendering

| Technology | Version | Role |
|---|---|---|
| Three.js | `^0.162.0` | 3D rendering engine |
| React Three Fiber | `^8.15.0` | React bindings for Three.js |
| @react-three/drei | `^9.88.0` | R3F utilities (controls, loaders, environments) |
| @react-three/postprocessing | `^2.16.0` | Post-processing effects |

### 6.2 3D Asset Pipeline

| Technology | Version | Role |
|---|---|---|
| Blender | 4.0+ | 3D modeling, animation, rigging, glTF export |
| glTF | 2.0 | 3D asset format (required for Three.js) |
| Ready Player Me | Latest API | Avatar generation from measurements |
| Draco Compression | Latest | Geometry compression for glTF files |
| KTX2 / Basis Universal | Latest | Texture compression |

### 6.3 File Format Requirements

| Format | Usage | Required |
|---|---|---|
| `.glb` / `.gltf` | 3D models (avatars, garments) | Yes |
| `.webp` | Textures, thumbnails | Yes |
| `.avif` | Photos (fallback) | Preferred |
| `.jpg` / `.png` | Source images | Accepted (converted to webp) |
| `.fbx` | Blender source files | Internal only |
| `.blend` | Blender source files | Internal only |

### 6.4 Performance Budget (3D)

| Metric | Target |
|---|---|
| Avatar file size | ≤5 MB (compressed GLB) |
| Garment file size | ≤2 MB (compressed GLB) |
| Texture size | ≤1024×1024 px (2048×2048 for hero views) |
| Draw calls | ≤200 |
| Triangles per avatar | ≤50k |
| Triangles per garment | ≤10k |
| Loading time (P75) | ≤3s |

---

## 7. Storage & Media

### 7.1 Image Hosting & CDN

| Field | Value |
|---|---|
| Technology | **Cloudinary** |
| Version | Latest (cloud-managed) |
| Node Package | `cloudinary@^1.41.0` |
| Features | Image upload, transformation, optimization, CDN, auto-tagging, face detection, signed URLs |
| Justification | Best-in-class image CDN with automatic format selection (webp/avif), transformations (crop, resize, filter), AI-powered tagging, and signed URL security. Free tier sufficient for MVP. |
| Prohibited Alternatives | Cloudflare Images, imgix, AWS CloudFront + S3 (more complex), Firebase Storage (limited transformations) |

### 7.2 Backup / Secondary Storage

| Field | Value |
|---|---|
| Technology | **Google Drive API** |
| Version | v3 |
| Node Package | `googleapis@^128.0.0` |
| Justification | Daily backups of user data to Google Drive for redundancy. Familiar to users, cost-effective. |
| Prohibited Alternatives | Dropbox API, OneDrive API, S3 Glacier (allowable backup only) |

### 7.3 Server-side Image Processing

| Field | Value |
|---|---|
| Technology | **Sharp** |
| Version | **0.33.x** |
| Package | `sharp@^0.33.0` |
| Features | Image resizing, format conversion, metadata extraction, streaming |
| Justification | Fast, memory-efficient Node.js image processing. Essential for thumbnail generation and image optimization before upload. |
| Prohibited Alternatives | ImageMagick (via `imagemagick`), Jimp (slow for production), gm (GraphicsMagick) |

### 7.4 Server-side Video Processing

| Field | Value |
|---|---|
| Technology | **FFmpeg** |
| Version | **6.x** |
| Package | `@ffmpeg-installer/ffmpeg@^1.1.0`, `fluent-ffmpeg@^2.1.0` |
| Justification | Industry-standard video/audio processing. Used for garment video clips, outfit animation rendering. |
| Prohibited Alternatives | none |

---

## 8. Notifications

| Field | Value |
|---|---|
| Technology | **Firebase Cloud Messaging (FCM)** |
| Version | Latest (cloud-managed) |
| Node Package | `firebase-admin@^11.10.0` |
| Features | Push notifications to web (via service worker) and mobile, topic-based messaging |
| Justification | Free, reliable push notification delivery, supports both web and mobile, integrates with Firebase suite. |
| Prohibited Alternatives | OneSignal, Pusher Beams, AWS SNS, Twilio Notify |

---

## 9. Infrastructure & DevOps

### 9.1 Frontend Hosting

| Field | Value |
|---|---|
| Provider | **Vercel** |
| Plan | Pro (Hobby for development) |
| Justification | Native Next.js hosting with automatic SSR/ISR/SSG, preview deployments, edge functions, analytics. |
| Prohibited Alternatives | Netlify (limited Next.js support), AWS Amplify, Cloudflare Pages |

### 9.2 Backend Hosting

| Field | Value |
|---|---|
| Provider | **Railway** or **Render** |
| Plan | Developer / Pro |
| Justification | Simplified deployment with managed PostgreSQL, Docker support, automatic HTTPS, good cost structure for MVPs. |
| Prohibited Alternatives | Heroku (expensive, no free tier), Fly.io (too new), AWS ECS (too complex for initial team) |

### 9.3 Containerization

| Field | Value |
|---|---|
| Technology | **Docker** |
| Version | **24.x** |
| Features | Docker Compose for local dev, multi-stage builds, Docker Hub / GitHub Container Registry |
| Justification | Reproducible environments, consistent development-to-production parity, microservice isolation. |
| Prohibited Alternatives | Podman (acceptable but not standard), LXC/LXD, Vagrant |

### 9.4 CI/CD

| Field | Value |
|---|---|
| Platform | **GitHub Actions** |
| Features | CI pipelines, CD deployments, matrix builds, cache, artifacts |
| Justification | Integrated with GitHub, generous free tier, large marketplace, YAML-based configuration. |
| Prohibited Alternatives | CircleCI, Jenkins, GitLab CI/CD, Travis CI, Bitbucket Pipelines |

### 9.5 Dependency Management

| Field | Value |
|---|---|
| Node Package Manager | **pnpm** |
| Version | **8.x** |
| Justification | Disk-efficient, fast, strict dependency resolution. Monorepo support via `pnpm workspace`. |
| Prohibited Alternatives | npm, Yarn Classic (v1), Yarn Berry (v3+) |

### 9.6 Monorepo Tool

| Field | Value |
|---|---|
| Technology | **Turborepo** |
| Version | **1.x** |
| Package | `turbo@^1.12.0` |
| Justification | High-performance monorepo orchestration, parallel task execution, caching, dependency graph awareness. |
| Prohibited Alternatives | Nx, Lerna, Rush, Lage |

---

## 10. Development Tools

| Tool | Version | Purpose |
|---|---|---|
| VS Code | Latest | Primary IDE |
| ESLint | `^8.56.0` | Code linting (both frontend and backend) |
| Prettier | `^3.2.0` | Code formatting |
| Husky | `^9.0.0` | Git hooks |
| lint-staged | `^15.2.0` | Staged file linting |
| Commitlint | `^18.6.0` | Conventional commit enforcement |
| Jest | `^29.7.0` | Unit/integration testing |
| Playwright | `^1.41.0` | E2E testing |
| Storybook | `^7.6.0` | Component development environment |
| NVM / Volta | Latest | Node.js version management |

---

## 11. Version Constraints Summary

| Category | Constraint | Enforcement |
|---|---|---|
| Node.js | 20.x LTS only | `.nvmrc`, `engines` in `package.json` |
| Package manager | pnpm 8.x only | `packageManager` in `package.json` |
| TypeScript strict | `strict: true` | `tsconfig.json` |
| React | 18.x only | `peerDependencies` |
| Next.js | 14.x only | `dependencies` |
| NestJS | 10.x only | `dependencies` |
| PostgreSQL | 16.x only | `docker-compose.yml` + Supabase |
| Python | 3.11.x only | `pyproject.toml`, Docker image tag |
| Node images | `node:20-alpine` | Dockerfile base image |
| Python images | `python:3.11-slim` | Dockerfile base image |

---

## 12. Compatibility Requirements

- **Browsers**:
  - Chrome 100+
  - Firefox 100+
  - Safari 15.4+
  - Edge 100+
  - Samsung Internet 20+
  - Opera 90+
- **Devices**:
  - Mobile: iOS 15+, Android 10+
  - Desktop: Windows 10+, macOS 11+
  - Tablet: iPadOS 15+, Android tablets
- **WebGL**: WebGL 2.0 required for 3D features; graceful fallback to 2D
- **Service Worker**: Required for PWA and offline support (Chrome, Firefox, Edge, Safari 16.4+)
- **IndexedDB**: Required for offline storage; all modern browsers support
- **Screen Readers**: NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android)

---

## 13. Dependency Rules

### 13.1 General Rules

1. **NO** adding a dependency without Tech Lead approval (recorded in RFC)
2. **NO** duplicate packages fulfilling the same role (e.g., both Zustand and Redux)
3. **NO** pinning exact versions without a documented reason
4. **YES** to using `^` range for libraries, `~` for tools
5. **YES** to `pnpm audit` before each production deploy
6. **YES** to running `pnpm outdated` weekly

### 13.2 Security Rules

1. All dependencies must be from the npm registry (no inline git dependencies for production)
2. No dependency with known CVEs at time of addition (check via `pnpm audit`)
3. No dependency with less than 1M weekly downloads for runtime packages (unless justified)
4. No dependency unmaintained for >1 year
5. License must be MIT, Apache-2.0, BSD, ISC, or similar permissive. NO GPL/LGPL/AGPL for runtime dependencies.

### 13.3 Size Rules

- Client-side JavaScript budget: **≤200 KB** (initial load, brotli compressed)
- Any new frontend dependency must contribute ≤5 KB (brotli) to the bundle
- Use `@next/bundle-analyzer` in CI to check bundle impact
- Large dependencies (>50 KB) require code splitting / dynamic import

---

## 14. Prohibited Alternatives — Quick Reference

| Category | Allowed | Prohibited |
|---|---|---|
| React meta-framework | Next.js | Remix, Gatsby, CRA, Astro, SvelteKit |
| Styling | Tailwind CSS | styled-components, CSS Modules, Sass (primary), Bootstrap |
| State (client) | Zustand | Redux, MobX, Jotai, Recoil |
| State (server) | TanStack Query | SWR, Apollo |
| Backend | NestJS | Express, Fastify, Koa |
| Database | PostgreSQL (Supabase) | MySQL, MongoDB, SQLite |
| ORM | TypeORM | Prisma, Drizzle, Sequelize |
| Cache | Redis | Memcached |
| 3D | R3F + Three.js | Babylon.js, Unity |
| AI | PyTorch | TensorFlow, JAX |
| Detection | Detectron2 | YOLOv8 (unless benchmark proven) |
| Image CDN | Cloudinary | Cloudflare Images, imgix |
| CI/CD | GitHub Actions | CircleCI, Jenkins |
| Hosting (FE) | Vercel | Netlify (for primary) |
| Package mgr | pnpm | npm, Yarn |

---

## 15. License Considerations

| Dependency | License | Compatibility |
|---|---|---|
| Next.js | MIT | ✅ |
| React | MIT | ✅ |
| TypeScript | Apache-2.0 | ✅ |
| Tailwind CSS | MIT | ✅ |
| Zustand | MIT | ✅ |
| TanStack Query | MIT | ✅ |
| Three.js | MIT | ✅ |
| React Three Fiber | MIT | ✅ |
| NestJS | MIT | ✅ |
| TypeORM | MIT | ✅ |
| PostgreSQL | PostgreSQL (permissive) | ✅ |
| Supabase | Apache-2.0 | ✅ |
| Redis | BSD-3-Clause | ✅ |
| Socket.IO | MIT | ✅ |
| BullMQ | MIT | ✅ |
| PyTorch | BSD | ✅ |
| Detectron2 | Apache-2.0 | ✅ |
| OpenCV | Apache-2.0 | ✅ |
| Mediapipe | Apache-2.0 | ✅ |
| Hugging Face Transformers | Apache-2.0 | ✅ |
| Cloudinary SDK | MIT | ✅ |
| Sharp | Apache-2.0 | ✅ |
| Firebase Admin | Apache-2.0 | ✅ |
| Docker | Apache-2.0 | ✅ |
| GitHub Actions | N/A (service) | ✅ |
| Blender | GPL-2.0+ | ⚠️ (asset pipeline only, not linked into app) |

### License Rules

- **NO GPL/AGPL/LGPL** licensed runtime dependencies in Node.js or Python production code
- GPL tools (like Blender) are permitted for the asset pipeline because they are development-time tools
- All runtime dependencies must be MIT, Apache-2.0, BSD, ISC, or Unlicense
- Any dependency with a "copyleft" license requires immediate legal review
- All dependencies must comply with the project's overall license (proprietary / commercial)
