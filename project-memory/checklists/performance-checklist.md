# Performance Checklist

---

## Frontend Performance

### Initial Load
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Total Blocking Time (TBT) < 200ms
- [ ] Speed Index < 3.0s

### Bundle Size
- [ ] Analyze bundle with `webpack-bundle-analyzer` or `next/bundle-analyzer`
- [ ] Main JS bundle < 150KB (gzipped)
- [ ] Main CSS bundle < 20KB (gzipped)
- [ ] Vendor bundle is split (React, Three.js separate from app code)
- [ ] Dynamic imports used for heavy components (3D viewer, charts)
- [ ] Route-based code splitting enabled (Next.js automatic)
- [ ] Library imports are tree-shakeable (named imports, not wildcard)
- [ ] Moment.js replaced with date-fns/luxon (or tree-shaken)
- [ ] Lodash imports are cherry-picked (import debounce from "lodash/debounce")
- [ ] Three.js imports are specific (not whole library)
- [ ] Large dependencies are lazy-loaded (e.g., chart libraries)
- [ ] Duplicate dependencies are eliminated (check with `npm dedupe`)
- [ ] Polyfills are conditionally loaded (not bundled for modern browsers)

### Image Optimization
- [ ] All images use `next/image` with proper `sizes` attribute
- [ ] Images are served in modern formats (WebP, AVIF) with fallback
- [ ] Images have correct `width` and `height` to prevent CLS
- [ ] Lazy loading enabled for below-the-fold images (`loading="lazy"`)
- [ ] Priority images (LCP) have `priority` attribute
- [ ] Image CDN (Cloudinary) configured with automatic quality optimization
- [ ] Image dimensions match display size (no oversized images)
- [ ] Responsive images with `srcSet` and `sizes` for different viewports
- [ ] Decorative images are not loaded (use CSS backgrounds)

### Rendering Optimization
- [ ] Components are memoized where beneficial (React.memo)
- [ ] Expensive computations are memoized (useMemo)
- [ ] Callback functions are memoized (useCallback)
- [ ] useEffect dependencies are correct (no unnecessary re-runs)
- [ ] List rendering uses virtualization for 50+ items (react-window)
- [ ] Avoid unnecessary re-renders (check with React DevTools Profiler)
- [ ] State is kept as local as possible (not hoisted unnecessarily)
- [ ] Context values are memoized (useMemo on context provider value)
- [ ] Large forms use controlled inputs efficiently (field-level state)
- [ ] Animation libraries use GPU-accelerated properties (transform, opacity)
- [ ] CSS animations over JavaScript animations for simple effects
- [ ] Will-change property used sparingly and correctly
- [ ] Contain property used for visual isolation

### Resource Loading
- [ ] Critical CSS is inlined (or loaded in head)
- [ ] Font files are optimized (next/font, variable fonts, subsetting)
- [ ] Font-display: swap is configured
- [ ] Preconnect to required origins (Cloudinary, API, CDN)
- [ ] Prefetch likely next pages (on hover or idle)
- [ ] Preload critical resources (hero images, fonts)
- [ ] DNS prefetch for third-party origins
- [ ] Third-party scripts loaded with async/defer
- [ ] Service worker caches static assets (stale-while-revalidate)
- [ ] Service worker caches API responses (network-first, cache-fallback)

### Network Optimization
- [ ] API requests are batched where possible
- [ ] API response payloads are minimal (only requested fields)
- [ ] Pagination used for lists (no unlimited scroll without limit)
- [ ] Debounced search inputs (300ms delay)
- [ ] Request deduplication (same request not sent twice in parallel)
- [ ] Optimistic updates for faster UX (mutations update cache immediately)
- [ ] TanStack Query stale times configured per query type
- [ ] Data prefetching for anticipated navigation
- [ ] GraphQL or REST API with sparse fieldsets (if applicable)
- [ ] Compression enabled (gzip/brotli on CDN and server)

### 3D Rendering Performance
- [ ] 3D model polygon count < 50k triangles
- [ ] 3D model texture size < 2048x2048
- [ ] Texture atlas used instead of multiple textures
- [ ] Level of Detail (LOD) implemented for distant models
- [ ] Draco mesh compression enabled for GLTF/GLB
- [ ] Animation system is optimized (not updating on every frame)
- [ ] Post-processing effects are minimal (bloom, SSAO only when needed)
- [ ] WebGL context is managed (not creating multiple contexts)
- [ ] Performance mode toggle (disables shadows, post-processing)
- [ ] Canvas resolution is device pixel ratio aware (max 2x)
- [ ] Instanced mesh for repeated objects
- [ ] Frustum culling enabled
- [ ] Object pooling for frequently created/destroyed objects
- [ ] GPU memory is monitored and cleaned up
- [ ] Fallback to 2D viewer on low-end devices

---

## Backend Performance

### API Response Times
- [ ] p50 response time < 100ms for read endpoints
- [ ] p95 response time < 300ms for read endpoints
- [ ] p99 response time < 1s for read endpoints
- [ ] Write endpoints (POST/PUT/DELETE) < 500ms
- [ ] File upload endpoints < 2s (excluding AI processing)
- [ ] AI processing endpoints < 5s (async preferred)
- [ ] WebSocket message latency < 50ms

### Connection Management
- [ ] Database connection pool size configured (min/max)
- [ ] Connection pool released after request completion
- [ ] HTTP keep-alive enabled
- [ ] HTTP/2 enabled for multiplexing
- [ ] TLS session resumption configured
- [ ] gzip/brotli compression enabled for responses
- [ ] Response compression level configured (level 6 for gzip)

### Async Operations
- [ ] Heavy operations delegated to background jobs
- [ ] Job queue monitoring (queue size, processing time, failure rate)
- [ ] Job timeout configured (max 30 minutes)
- [ ] Job retry with exponential backoff
- [ ] Concurrent job processing limit configured
- [ ] Job results cached for polling

### Memory Management
- [ ] No memory leaks in long-running processes
- [ ] Node.js heap limit configured (`--max-old-space-size`)
- [ ] Garbage collection monitored
- [ ] Object pooling for frequently allocated objects
- [ ] Stream processing for large payloads (CSV/JSON export)
- [ ] Buffer limits configured for file processing
- [ ] Event listeners are cleaned up (no dangling listeners)

---

## Database Performance

### Query Optimization
- [ ] All queries use indexes (EXPLAIN ANALYZE reviewed)
- [ ] No sequential scans on large tables
- [ ] N+1 queries eliminated (eager loading, batch loading)
- [ ] Query result limits enforced (pagination)
- [ ] SELECT only needed columns (no SELECT *)
- [ ] JOINs use indexed columns
- [ ] Subqueries optimized (use JOINs or CTEs where appropriate)
- [ ] Complex queries have it, not too many JOINs (max 4-5)
- [ ] Full-text search uses GIN indexes
- [ ] JSONB queries use GIN indexes (if applicable)
- [ ] Array columns use GIN indexes (if applicable)

### Indexing
- [ ] Primary keys are indexed (automatic)
- [ ] Foreign keys are indexed
- [ ] Columns used in WHERE, ORDER BY, JOIN are indexed
- [ ] Composite indexes match query patterns (column order matters)
- [ ] Partial indexes for filtered queries (WHERE is_active = true)
- [ ] Covering indexes for frequent queries (INCLUDE columns)
- [ ] B-tree indexes for range queries, equality
- [ ] Hash indexes for equality only (if needed)
- [ ] GIN/GiST indexes for text search, arrays, JSONB
- [ ] BRIN indexes for large, naturally ordered tables (timestamps)
- [ ] Index maintenance (REINDEX, VACUUM) scheduled
- [ ] Unused indexes identified and removed

### Database Configuration
- [ ] shared_buffers: 25% of RAM
- [ ] effective_cache_size: 75% of RAM
- [ ] work_mem: 4-8MB per query (adjust based on query complexity)
- [ ] maintenance_work_mem: 256MB-1GB
- [ ] max_connections: appropriate for application (100-200)
- [ ] checkpoint_completion_target: 0.9
- [ ] autovacuum enabled with appropriate thresholds
- [ ] Connection pooling with PgBouncer or internal pool
- [ ] Statement timeout: 30s
- [ ] Idle session timeout: 10min
- [ ] Slow query log enabled (threshold: 200ms)
- [ ] Database version up-to-date (PostgreSQL 15+)

### Migration Performance
- [ ] Long-running migrations use background processing
- [ ] Indexes created CONCURRENTLY (non-blocking)
- [ ] Large table alterations use batching
- [ ] Migration rollback tested and timed
- [ ] Migration is reversible (destructive changes have backup)

---

## AI Pipeline Performance

### Inference Performance
- [ ] Detection model inference time < 500ms on GPU
- [ ] Detection model inference time < 2s on CPU
- [ ] Classification inference time < 200ms on GPU
- [ ] Background removal < 2s on GPU
- [ ] Background removal < 5s on CPU
- [ ] Color extraction < 100ms
- [ ] Body measurement < 3s on GPU
- [ ] Skin tone detection < 500ms
- [ ] Full pipeline (detect + classify + color + bg remove) < 3s on GPU

### Model Optimization
- [ ] Models use FP16 inference (half precision)
- [ ] TorchScript or ONNX conversion for faster inference
- [ ] TensorRT optimization applied (NVIDIA GPU)
- [ ] Model quantization (INT8) for CPU deployment
- [ ] Batch inference for multiple images
- [ ] Model warm-up on startup (dummy inference)
- [ ] CUDA graphs for repetitive inference patterns
- [ ] torch.compile used for PyTorch model optimization

### Resource Management
- [ ] GPU memory limited per process (CUDA_VISIBLE_DEVICES)
- [ ] GPU memory garbage collection between requests (torch.cuda.empty_cache)
- [ ] Graceful fallback to CPU on GPU OOM
- [ ] Maximum concurrent inference jobs (queue the rest)
- [ ] Inference timeout: 30s per request
- [ ] Request queuing with priority
- [ ] Model replication for high throughput (multiple model instances)
- [ ] Auto-scaling based on queue depth

### Image Processing Pipeline
- [ ] Image decoding uses hardware acceleration (libjpeg-turbo)
- [ ] Image resizing uses GPU (torchvision.transforms, OpenCV CUDA)
- [ ] Parallel processing for batch operations
- [ ] Image format conversion optimized (avoid unnecessary decode/encode)
- [ ] Pipeline stages are profiled (time per stage)
- [ ] Bottlenecks identified and optimized

---

## Image Optimization Checklist

### Upload Pipeline
- [ ] Images auto-converted to WebP format
- [ ] Quality setting based on image complexity (80-90%)
- [ ] Image metadata stripped (EXIF, GPS, thumbnails)
- [ ] Image dimensions capped (max 2000px on longest side)
- [ ] Compression applied before upload (reduce transfer size)
- [ ] Progressive JPEG for large images
- [ ] Multiple quality levels for different use cases
- [ ] Original image retained for re-processing

### Delivery Optimization
- [ ] Cloudinary automatic quality optimization (`q_auto`)
- [ ] Cloudinary automatic format selection (`f_auto`)
- [ ] Responsive image breakpoints defined
- [ ] CDN caching with long TTL (30+ days for static images)
- [ ] CDN cache invalidation on image update
- [ ] Signed URLs with expiration for private images
- [ ] Image lazy loading via native loading attribute
- [ ] Blur-up placeholder for progressive loading
- [ ] Average color placeholder (dominant color)
- [ ] Preconnect to image CDN domain

### Thumbnail Generation
- [ ] Thumbnail sizes: 50x50, 150x150, 300x300, 600x600
- [ ] Smart cropping (center on detected garment)
- [ ] Sharpening applied after resize
- [ ] Consistent aspect ratio (1:1 square for grid)
- [ ] Uniform background (white or transparent)

---

## Caching Implementation Checklist

### Browser Caching
- [ ] Static assets have far-future Cache-Control headers (1 year)
- [ ] HTML pages have no-cache or ETag-based caching
- [ ] API responses have appropriate Cache-Control headers
- [ ] Service worker caches app shell for offline access
- [ ] Service worker cache versioned and invalidated on update

### CDN Caching
- [ ] Image CDN (Cloudinary) has long cache TTL (30 days)
- [ ] Static asset CDN has cache TTL of 1 year
- [ ] API responses cached at CDN for public endpoints
- [ ] Cache purging on content update
- [ ] Stale-while-revalidate for CDN cached content

### Server-Side Caching (Redis)
- [ ] GET endpoint responses cached (TTL based on data volatility)
  - [ ] Garment lists: 5 minutes
  - [ ] Garment detail: 5 minutes
  - [ ] Outfit lists: 5 minutes
  - [ ] Outfit detail: 5 minutes
  - [ ] Wardrobe stats: 15 minutes
  - [ ] Analytics data: 1 hour
  - [ ] User profile: 10 minutes
  - [ ] Reference data (categories, colors): 1 day
- [ ] Cache invalidation on related mutations
  - [ ] Garment created/updated/deleted -> invalidate garment lists, stats
  - [ ] Outfit created/updated/deleted -> invalidate outfit lists
  - [ ] User profile updated -> invalidate profile
- [ ] Cache stampede prevention (mutex, probabilistic early expiration)
- [ ] Cache key naming convention (consistent prefix pattern)
- [ ] Cache size monitoring (Redis memory usage)
- [ ] Eviction policy: allkeys-lru (for cache) or noeviction (for sessions)
- [ ] Cache hit ratio monitoring (target: >80%)

### Application-Level Caching
- [ ] TanStack Query client-side cache configured
- [ ] staleTime: 5 minutes for lists, 1 minute for detail
- [ ] gcTime (cacheTime): 30 minutes
- [ ] Prefetching for likely next pages
- [ ] Optimistic updates for mutations
- [ ] LocalStorage for UI preferences (theme, view mode, filters)
- [ ] SessionStorage for transient state (wizard progress)

---

## Load Testing Checklist

### Test Preparation
- [ ] Define baseline metrics (current performance under normal load)
- [ ] Define target metrics (desired performance under expected load)
- [ ] Create realistic test scenarios (user behavior patterns)
- [ ] Create test data (representative data volume and variety)
- [ ] Set up load testing environment (isolated from production)
- [ ] Configure monitoring (server metrics, database metrics, application metrics)
- [ ] Define pass/fail criteria for each test scenario

### Load Test Scenarios
- [ ] **Baseline test**: 1 virtual user, normal operations
- [ ] **Average load test**: expected concurrent users (e.g., 100 users)
- [ ] **Peak load test**: 2x expected peak concurrent users (e.g., 500 users)
- [ ] **Stress test**: gradually increase until system fails
- [ ] **Endurance test**: sustained load for 4+ hours (memory leak detection)
- [ ] **Spike test**: sudden 10x load increase
- [ ] **Scalability test**: test with different instance counts
- [ ] **Read-heavy test**: 90% reads, 10% writes
- [ ] **Write-heavy test**: 50% reads, 50% writes (AI uploads)
- [ ] **Mixed workload test**: realistic mix of endpoints

### Metrics to Capture
- [ ] Response time (p50, p95, p99, max)
- [ ] Throughput (requests per second)
- [ ] Error rate (percentage of failed requests)
- [ ] CPU utilization (per service)
- [ ] Memory utilization (per service)
- [ ] GPU utilization (AI service)
- [ ] Database connection pool utilization
- [ ] Database query time (p50, p95)
- [ ] Redis memory usage and hit ratio
- [ ] Disk I/O (reads/writes per second)
- [ ] Network I/O (bytes in/out per second)
- [ ] WebSocket connection count
- [ ] Background job queue depth

### Pass/Fail Criteria
- [ ] p95 response time < 500ms for all endpoints
- [ ] Error rate < 0.1% of requests
- [ ] No 5xx errors under expected peak load
- [ ] No request timeouts under expected peak load
- [ ] CPU < 80% for all services
- [ ] Memory < 80% for all services
- [ ] Database pool < 80% utilization
- [ ] Database query p95 < 200ms
- [ ] Redis cache hit ratio > 80%
- [ ] No memory leaks (memory stable over endurance test)
- [ ] No database deadlocks
- [ ] No connection pool exhaustion
- [ ] Auto-scaling triggers work correctly
- [ ] System recovers after load decreases

### Tools
- [ ] k6 for load testing scripts
- [ ] Artillery for API load testing
- [ ] Lighthouse CI for frontend performance
- [ ] Web Vitals library for real user monitoring
- [ ] Sentry for error monitoring
- [ ] DataDog/New Relic for infrastructure monitoring
- [ ] Prometheus + Grafana for metrics and dashboards
- [ ] RedisInsight for Redis monitoring
- [ ] pgBadger for PostgreSQL query analysis
- [ ] clinic.js for Node.js performance profiling
- [ ] Chrome DevTools Performance tab for frontend profiling
- [ ] React DevTools Profiler for component rendering analysis
