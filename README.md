# Closet Inteligente Digital

Gestión inteligente de vestuario personal con recomendaciones basadas en IA, calendarización de outfits y visualización 3D de avatares.

## Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Three.js |
| **Backend** | NestJS, TypeScript, PostgreSQL, Redis, WebSocket (Socket.IO) |
| **AI/CV** | Python, FastAPI, OpenCV, rembg, ONNX |
| **Infra** | Docker, Nginx, Prometheus, Grafana, OpenTelemetry |

## Arquitectura

```
frontend (Next.js :3000)
    │
    ▼
nginx (:80) ──→ backend (NestJS :4000) ──→ postgres (:5432)
    │                    │                     redis (:6379)
    │                    ▼
    └──→ ai-service (FastAPI :5100)
```

## Servicios

- **Frontend**: App web React/Next.js con 17 rutas
- **Backend**: API REST + WebSocket con autenticación JWT, rate limiting, CSRF
- **AI Service**: Procesamiento de imágenes (clasificación, colores, backgrounds)
- **PostgreSQL**: Base de datos con pgvector para búsqueda semántica
- **Redis**: Caché, rate limiting, colas BullMQ, sesiones

## Inicio rápido

```bash
# Desarrollo con Docker
docker compose up -d

# O sin Docker
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && pnpm install && pnpm dev

# AI Service
cd python && pip install -e ".[dev]" && uvicorn app.main:app
```

## Scripts principales

| Comando | Descripción |
|---|---|
| `npm run build` | Build backend NestJS |
| `npm test` | Tests unitarios backend |
| `pnpm build` | Build frontend Next.js |
| `pnpm test` | Tests Vitest frontend |
| `python -m pytest` | Tests Python AI |

## Despliegue

Ver [`DEPLOYMENT_RUNBOOK.md`](./DEPLOYMENT_RUNBOOK.md) y [`docker-compose.staging.yml`](./docker-compose.staging.yml).
