# ADR-014: Containerization

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform has a multi-service architecture: NestJS backend, Python AI microservice with GPU dependencies, Redis caching layer, and worker processes for background jobs (image processing, AI inference queue). These services must run consistently across local development environments (Windows, macOS, Linux), CI/CD pipelines (GitHub Actions), and production (Railway). The containerization solution must support multi-stage builds for optimized images, GPU passthrough for the AI service, service orchestration for local development with hot-reloading, and small image sizes for fast deployment.

## DECISION
We will use **Docker** for containerization across the entire platform.

Docker provides consistent runtime environments across all stages of development and deployment. The project uses a multi-container architecture managed via Docker Compose for local development and Dockerfiles for production builds.

The container architecture includes:
- **backend service** — NestJS application in a multi-stage Dockerfile: `node:20-alpine` base, development stage with volume mounts for hot-reload, production stage with compiled output only
- **ai service** — Python service based on `pytorch/pytorch:2.0-cuda12.1-runtime` with Detectron2, OpenCV, and MediaPipe installed, GPU passthrough via `--gpus all`, separate CPU-only variant for development
- **redis** — Official `redis:7-alpine` image with custom config for persistence and pub/sub
- **worker** — NestJS worker process with Bull queue for background job processing

Docker Compose orchestrates all services for local development with dependency health checks, shared networks, volume mounts for hot-reloading, and environment variable management via `.env` file.

## CONSEQUENCES

**Positive:**
- Consistent environments across developer machines eliminate "works on my machine" issues
- Multi-stage builds produce small production images (~150MB for backend, ~3GB for AI with CUDA)
- Docker Compose simplifies local development with one-command service startup
- GPU passthrough enables AI model inference in containers during development
- Railway's container-native deployment matches our Docker strategy exactly
- CI/CD reproducibility — GitHub Actions runs the same container images that deploy to production

**Negative:**
- Windows Docker Desktop has performance overhead with WSL2 filesystem mounts
- AI service image is large (~3GB with CUDA dependencies) — slow to pull on deployment and CI
- GPU passthrough configuration differs between Linux (nvidia-container-toolkit) and Windows
- Docker Compose networking complexity increases as services grow
- Volume mount performance for hot-reloading on Windows is significantly slower than native macOS/Linux
- Container orchestration for production (scaling, service discovery) requires additional tooling beyond basic Docker

## ALTERNATIVES CONSIDERED

### Kubernetes
- **Pros:** Production-grade orchestration, auto-scaling, self-healing, service discovery, rolling updates
- **Cons:** Significant operational complexity, over-engineered for the current scale, requires cluster management expertise, higher infrastructure cost (minimum 3 nodes), steep learning curve for the team, overkill for a single-team project

### Podman
- **Pros:** Daemonless architecture, rootless containers by default, Docker-compatible CLI, better security model
- **Cons:** Smaller ecosystem and community, fewer tutorials and examples for common setups, Docker Compose compatibility incomplete, GPU passthrough setup more complex, Railway and most cloud platforms assume Docker

### Serverless (without containers)
- **Pros:** No container management, auto-scaling to zero, pay-per-execution pricing, no infrastructure to manage
- **Cons:** Execution time limits (15 minutes on AWS Lambda) unsuitable for AI inference, cold start latency impacts API responsiveness, no GPU support for AI workloads, stateful service (Socket.IO) difficult on serverless, migration from serverless to containers is expensive and complex

## DATE
2026-05-25

## REVIEWERS
DevOps Engineer, Lead Backend Engineer, CTO
