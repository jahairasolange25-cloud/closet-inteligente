# Infrastructure / DevOps Task Template

## TASK_ID: `INFRA-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing the infrastructure change>

---

## CONTEXT FILES

```
# Example:
docker-compose.yml
Dockerfile
Dockerfile.prod
.github/workflows/deploy.yml
k8s/namespace.yaml
k8s/deployment.yaml
k8s/service.yaml
k8s/configmap.yaml
.helm/
terraform/
```

**Guidance**: Include Dockerfiles, compose files, CI workflow YAMLs, Kubernetes manifests, Helm charts, and Terraform/Pulumi configs relevant to the change.

---

## ALLOWED FILES

```
Dockerfile.prod
.github/workflows/deploy.yml
k8s/
```

---

## FORBIDDEN FILES

```
docker-compose.yml      (local dev config — infra team only)
.github/workflows/test.yml
terraform/state/
```

---

## REQUIREMENTS

```
- [ ] Add a `healthcheck` to `Dockerfile.prod` that runs `curl -f http://localhost:3000/api/health`
- [ ] Healthcheck interval: 30s, timeout: 10s, retries: 3, start period: 40s
- [ ] Add liveness and readiness probes in `k8s/deployment.yaml` pointing to same endpoint
- [ ] Update `.github/workflows/deploy.yml` to add a "Wait for health" step after deployment
- [ ] The health endpoint must return 200 within 60 seconds of container start
```

**Guidance on Docker**:
- Use multi-stage builds: `builder` stage for `npm ci` + `npm run build`, `runner` stage with `node:20-alpine` for production.
- Never run containers as root — use `USER node` in the runner stage.
- Pin base image digests (`node:20-alpine@sha256:...`) for reproducibility.
- Use `COPY --chown=node:node` for correct permissions.

**Guidance on CI/CD (GitHub Actions)**:
- Split workflows: `test.yml` (PR), `deploy.yml` (push to main/tag).
- Cache `node_modules` and `.next/cache` using `actions/cache`.
- Use matrix builds when testing multiple Node/Python versions.
- Pin action versions to commit SHAs for supply-chain security.

**Guidance on deployment**:
- Prefer rolling updates in Kubernetes (`strategy.type: RollingUpdate`) with `maxSurge: 1`, `maxUnavailable: 0`.
- Use ConfigMaps for non-sensitive config, Secrets (via external-secrets or SealedSecrets) for credentials.
- Always set resource requests and limits in pod specs.
- Add pod disruption budgets for production namespaces.

---

## ACCEPTANCE CRITERIA

```
GIVEN a container started from the new image
WHEN 60 seconds have passed
THEN the health endpoint responds with 200 OK

GIVEN the deployment is updated
WHEN the rollout completes
THEN kubectl rollout status shows "successfully rolled out"
AND the old pods are terminated
AND the new pods are all in Ready state

GIVEN the health endpoint returns 500
WHEN the liveness probe fails 3 times
THEN Kubernetes restarts the container
```

---

## EDGE CASES

```
- [ ] Container starts but health endpoint isn't ready yet → start period prevents premature restart
- [ ] Image pull fails → deployment shows ImagePullBackOff, alert fires
- [ ] Resource limits are exceeded → pod is OOMKilled, autoscaler triggers new replica
- [ ] ConfigMap changes → pods are not auto-restarted (must use reloader or manual rollout)
```

---

## TESTS REQUIRED

```
# Infrastructure testing — validation commands, not unit tests
- [ ] `docker build -t app:test -f Dockerfile.prod .` succeeds
- [ ] `docker run app:test sh -c "curl -f http://localhost:3000/api/health"` returns 0
- [ ] `kubectl apply --dry-run=client -f k8s/` succeeds
- [ ] `helm lint .helm/` passes (if Helm is used)
```

**Guidance**: Infrastructure testing is about validation (dry-run, lint, build). Write validation commands that can be run locally or in CI. Avoid mocking cloud provider APIs — use `--dry-run` flags instead.

---

## EXPECTED OUTPUT

```
FILES MODIFIED:
  - Dockerfile.prod                         (+6 lines)
  - k8s/deployment.yaml                     (+20 lines)
  - .github/workflows/deploy.yml            (+12 lines)

Verification commands:
  docker build -t app:test -f Dockerfile.prod .
  kubectl apply --dry-run=client -f k8s/deployment.yaml
```

---

## Example: Well-Formed Infrastructure Task

```
TASK_ID: INFRA-0009
TITLE: Add Redis sidecar container for development environment
OBJECTIVE: Add a Redis 7 container to docker-compose.yml configured for local development use by the outfit generation service.

CONTEXT FILES:
  docker-compose.yml
  .env.example
  src/modules/outfit/outfit.module.ts

ALLOWED FILES:
  docker-compose.yml
  .env.example

FORBIDDEN FILES:
  Dockerfile
  Dockerfile.prod
  k8s/
  .github/

REQUIREMENTS:
  - [ ] Add `redis` service using `redis:7-alpine` image
  - [ ] Port mapping: 6379:6379
  - [ ] Mount `./data/redis:/data` for persistence
  - [ ] Add `REDIS_HOST=redis`, `REDIS_PORT=6379` to .env.example
  - [ ] Redis container must depend on nothing; api service must depend on redis
  - [ ] Healthcheck: `redis-cli ping` every 10s

ACCEPTANCE CRITERIA:
  GIVEN docker-compose up is run
  WHEN all containers are healthy
  THEN the api container can connect to redis at redis:6379
  AND SET/GET operations work

EDGE CASES:
  - [ ] ./data/redis directory doesn't exist → Docker creates it automatically
  - [ ] Port 6379 already in use on host → Docker error is descriptive

EXPECTED OUTPUT:
  FILES MODIFIED:
    - docker-compose.yml
    - .env.example
```
