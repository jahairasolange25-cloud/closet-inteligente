# Performance

## Overview
Performance is a critical quality attribute for Closet Inteligente Digital. This document defines measurable performance targets, testing strategies, optimization techniques, and monitoring approaches across frontend, backend, AI pipeline, and infrastructure layers.

---

## Performance Targets

### Critical Performance Targets

| Metric | Target (p95) | Target (p99) | Measurement | Priority |
|--------|-------------|-------------|-------------|----------|
| API response time (CRUD) | <200ms | <500ms | Request duration on server | P0 |
| API response time (search) | <500ms | <1s | Request duration on server | P0 |
| API response time (auth) | <300ms | <1s | Full auth flow duration | P0 |
| Page load (initial) | <2s | <3s | LCP on desktop | P0 |
| Page load (subsequent) | <1s | <2s | Navigation to interactive | P0 |
| Image processing | <3s | <5s | Upload to processed thumbnail | P0 |
| AI garment detection | <5s | <10s | Upload to detection results | P1 |
| AI size estimation | <3s | <5s | Image to size prediction | P1 |
| AI outfit recommendation | <3s | <8s | Request to recommendation list | P1 |
| AI avatar generation | <30s | <60s | Photo to 3D avatar | P2 |
| AI virtual try-on | <15s | <30s | Garment + avatar to try-on result | P1 |
| AI pipeline end-to-end | <15s | <30s | Upload to all results available | P1 |
| Search autocomplete | <100ms | <200ms | Keystroke to suggestions | P1 |
| File upload (10MB) | <10s | <20s | Client to Cloudinary | P1 |
| WebSocket message delivery | <50ms | <100ms | Server to client | P2 |
| Database query (simple) | <10ms | <50ms | Execution time on DB | P0 |
| Database query (complex) | <100ms | <500ms | Execution time on DB | P0 |
| CSS/JS bundle parse | <500ms | <1s | Browser parse + evaluate | P1 |

### Web Vitals Targets (Real User Monitoring)

| Metric | Target | Threshold (Good) | Threshold (Needs Improvement) | Threshold (Poor) |
|--------|--------|-----------------|-------------------------------|------------------|
| LCP (Largest Contentful Paint) | <2.5s | <2.5s | 2.5s - 4.0s | >4.0s |
| FID (First Input Delay) | <100ms | <100ms | 100ms - 300ms | >300ms |
| CLS (Cumulative Layout Shift) | <0.1 | <0.1 | 0.1 - 0.25 | >0.25 |
| INP (Interaction to Next Paint) | <200ms | <200ms | 200ms - 500ms | >500ms |
| TTFB (Time to First Byte) | <800ms | <800ms | 800ms - 1.8s | >1.8s |
| FCP (First Contentful Paint) | <1.8s | <1.8s | 1.8s - 3.0s | >3.0s |

### Bundle Size Budgets

| Resource | Budget (Production) | Warning Threshold | Enforcement |
|----------|--------------------|--------------------|-------------|
| Initial JS (First Load) | <200KB | >180KB | CI failure >200KB |
| Total JS (All Routes) | <500KB | >450KB | CI warning >450KB |
| CSS (All) | <50KB | >40KB | CI failure >60KB |
| Fonts | <100KB | >80KB | Build warning |
| Images (Above Fold) | <200KB total | >150KB total | Lint warning |
| Third-party JS | <100KB | >80KB | Manual review |
| Total Page Weight | <2MB | >1.5MB | CI warning >2MB |

---

## Performance Testing Strategy

### Testing Types

| Test Type | Frequency | Tools | Scope |
|-----------|-----------|-------|-------|
| Load testing | Weekly (CI) | k6, Artillery | API endpoints, critical user flows |
| Stress testing | Monthly | k6 | Identify breaking points |
| Endurance testing | Quarterly | k6 | 24-hour sustained load |
| Spike testing | Monthly | k6 | Sudden traffic bursts |
| Frontend performance | Every PR | Lighthouse CI, Web Vitals | Bundle size, render performance |
| Database performance | Weekly | pg_stat_statements, explain analyze | Query plans, index usage |
| AI pipeline benchmarking | Per model release | Custom benchmark suite | Model inference time, memory usage |
| Network latency testing | Monthly | Custom synthetic checks | CDN performance, regional latency |
| 3D rendering performance | Per feature release | Three.js inspector, Spector.js | Frame rate, draw calls, memory |

### Load Testing Scenarios

| Scenario | Virtual Users | Duration | Target Endpoints | Success Criteria |
|----------|---------------|----------|-----------------|------------------|
| Browse wardrobe | 500 | 30 min | GET /api/garments, GET /api/garments/:id | p95 < 200ms, error rate < 1% |
| Search products | 200 | 30 min | GET /api/garments/search | p95 < 500ms, error rate < 1% |
| Upload garments | 100 | 30 min | POST /api/garments (with image) | p95 < 5s (processing), error rate < 2% |
| Outfit creation | 200 | 30 min | POST /api/outfits, GET /api/recommendations | p95 < 3s, error rate < 1% |
| AI detection | 50 concurrent | 30 min | POST /api/ai/detect | p95 < 10s from upload, success rate > 95% |
| Virtual try-on | 30 concurrent | 30 min | POST /api/ai/tryon | p95 < 30s, success rate > 85% |
| User authentication | 100/s | 30 min | POST /api/auth/login, POST /api/auth/register | p95 < 300ms, error rate < 1% |
| Mixed workload | 1000 | 60 min | All endpoints (proportional to real traffic) | All p95 targets met |
| WebSocket | 5000 connections | 30 min | WebSocket connect, message, disconnect | Connection success > 99%, message latency < 100ms |

### Load Testing Configuration (k6 Example)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latencyTrend = new Trend('api_latency');

export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '10m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

export default function () {
  const headers = {
    'Authorization': 'Bearer ' + __ENV.TEST_TOKEN,
    'Content-Type': 'application/json',
  };

  const res1 = http.get(__ENV.BASE_URL + '/api/garments?page=1&limit=20', { headers });
  check(res1, { 'wardrobe list status 200': (r) => r.status === 200 });
  errorRate.add(res1.status !== 200);
  latencyTrend.add(res1.timings.duration);

  sleep(1);

  const res2 = http.get(__ENV.BASE_URL + '/api/garments/sample-id', { headers });
  check(res2, { 'garment detail status 200': (r) => r.status === 200 });

  sleep(2);
}
```

---

## Bottleneck Identification

### Common Bottlenecks and Detection

| Layer | Bottleneck | Detection Method | Tool |
|-------|------------|-----------------|------|
| Frontend | Large bundle size | Bundle analyzer | webpack-bundle-analyzer, source-map-explorer |
| Frontend | Slow component rendering | React Profiler | React DevTools Profiler |
| Frontend | Excessive re-renders | Component render count | React DevTools, why-did-you-render |
| Frontend | Large images | Network tab analysis | Lighthouse |
| Frontend | Blocking JS | Main thread tasks | Performance tab (Chrome DevTools) |
| Frontend | Layout thrashing | Forced reflows | Performance tab |
| Backend | Slow database queries | Slow query log | pg_stat_statements, EXPLAIN ANALYZE |
| Backend | N+1 queries | Query count monitoring | DataLoader, query logger |
| Backend | Missing indexes | Seq scan detection | pg_stat_user_tables |
| Backend | Synchronous processing | Event loop lag | clinic.js, Node.js inspector |
| Backend | Memory leaks | Heap growth monitoring | Node.js --inspect, heapdump |
| Backend | Connection pool exhaustion | Pool wait times | pg-pool metrics, Redis client metrics |
| Backend | Serialization overhead | CPU profiling | clinic flame, Node.js CPU profile |
| AI Pipeline | GPU utilization | GPU metrics | nvidia-smi, DCGM |
| AI Pipeline | Cold model loading | First inference time | Custom timing instrumentation |
| AI Pipeline | Memory fragmentation | Allocation patterns | CUDA memory profiler |
| AI Pipeline | Queue buildup | Queue depth | Redis queue monitoring |
| Infrastructure | DNS resolution | DNS query time | dig, curl -w |
| Infrastructure | TLS handshake | SSL/TLS time | curl -w, SSL Labs |
| Infrastructure | CDN miss ratio | Cache hit rate | CDN analytics |
| Database | Lock contention | Lock wait events | pg_locks, pg_stat_activity |
| Database | Bloat | Table/vacuum stats | pgstattuple, pg_repack |
| Database | Transaction wrap-around | Age of transactions | txid_current() |

### Performance Profiling Checklist

PROFILING CHECKLIST

When investigating a performance issue:

1. DEFINE THE PROBLEM
   [ ] What is the user-facing symptom?
   [ ] What is the measured metric?
   [ ] What is the target vs. actual value?
   [ ] When did it start? (correlate with deployments)

2. FRONTEND ANALYSIS
   [ ] Check Lighthouse report
   [ ] Check Web Vitals data (Vercel Analytics)
   [ ] Run React Profiler
   [ ] Analyze bundle with webpack-bundle-analyzer
   [ ] Check network waterfall
   [ ] Verify code splitting is working

3. BACKEND ANALYSIS
   [ ] Check API latency metrics (Grafana)
   [ ] Check slow query log (PostgreSQL)
   [ ] Check Redis cache hit rate
   [ ] Profile CPU (clinic flame)
   [ ] Profile memory (heap snapshot)
   [ ] Check connection pool usage

4. AI PIPELINE ANALYSIS
   [ ] Check GPU utilization
   [ ] Check inference latency
   [ ] Check preprocessing time
   [ ] Check model loading time
   [ ] Verify batch processing efficiency

5. INFRASTRUCTURE ANALYSIS
   [ ] Check CPU/memory/disk metrics
   [ ] Check network I/O
   [ ] Verify auto-scaling is active
   [ ] Check CDN cache hit rate
   [ ] Verify database replicas are handling load

6. DATABASE ANALYSIS
   [ ] Run pg_stat_statements analysis
   [ ] Identify missing indexes
   [ ] Check for table/index bloat
   [ ] Analyze lock contention
   [ ] Check vacuum/analyze status

---

## Caching Strategy

### Caching Layers

```
[Browser Cache]         TTL: 1 year (immutable assets), 5 min (API responses)
       |
[Service Worker]        TTL: Strategy-based (stale-while-revalidate for pages)
       |
[CDN Cache]             TTL: 1 hour (static assets), 10 min (API responses)
       |
[Application Cache]     (In-memory: Node.js, LRU cache)
       |
[Redis Cache]           TTL: 5 min - 24 hours (configurable per type)
       |
[Database Cache]        (PostgreSQL shared buffers + OS page cache)
```

### Cache Configuration by Data Type

| Data Type | Cache Layer | TTL | Invalidation Strategy | Size (est.) |
|-----------|-------------|-----|----------------------|-------------|
| Static JS/CSS | CDN + Browser | 1 year | Content hash in URL | 500 KB |
| Static images (logos, icons) | CDN + Browser | 1 year | Content hash | 200 KB |
| User avatar images | CDN | 24 hours | On update, purge CDN | 500 KB avg |
| Garment thumbnails | CDN | 1 week | On garment update | 100 KB avg |
| Garment full images | CDN | 1 week | On garment update | 2 MB avg |
| Outfit recommendation responses | Redis | 5 minutes | On outfit/add/remove | 50 KB per user |
| Search results | Redis | 2 minutes | On garment create/update/delete | Variable |
| Product catalog | Redis | 1 hour | On admin update | 10 MB |
| User profiles | Redis | 15 minutes | On profile update | 5 KB per user |
| Session data | Redis | Session TTL (7 days) | On logout | 1 KB per user |
| Rate limit counters | Redis (in-memory only) | Window TTL | Automatic expiry | 100 bytes per key |
| AI detection results | Redis | 24 hours | On image replace | 5 KB per image |
| 3D model data (avatars) | CDN | 1 week | On avatar regeneration | 5 MB avg |
| Feature flags | In-memory (refresh every 60s) | 60 seconds | Automatic refresh | 10 KB |
| Configuration | In-memory (on startup) | Application lifetime | On restart/reload | 100 KB |

### Redis Cache Key Namespacing

```
garment:{id}:detail          - Full garment details
garment:{id}:images          - Image URLs and metadata
garment:{id}:detection       - AI detection results
user:{id}:profile            - User profile data
user:{id}:wardrobe:summary   - Wardrobe overview
user:{id}:outfits:recent     - Recent outfits (limit 10)
search:{query_hash}:results  - Search result IDs
search:suggestions:{prefix}  - Autocomplete suggestions
rec:{user_id}:daily          - Daily outfit recommendations
rec:{user_id}:weather:{temp} - Weather-based recommendations
ai:detection:{image_hash}    - Detection results (dedup by image hash)
ai:outfit:{garments_hash}    - Outfit combinations
session:{token_hash}         - User session data
ratelimit:{endpoint}:{user_id}    - Rate limit counters
ratelimit:global:{ip}             - Global per-IP rate limit
```

### Cache Invalidation Strategy

| Trigger | Invalidation Action | Cache Layers Affected |
|---------|--------------------|----------------------|
| Garment created/updated/deleted | Delete garment cache keys | Redis (garment:*), CDN (garment images) |
| User updates profile | Delete user cache keys | Redis (user:*:{id}:*) |
| Outfit created/updated/deleted | Delete recommendation cache | Redis (rec:*:{user_id}:*), outfit CDN purge |
| New outfit recommendation generated | Update recommendation cache | Redis (rec:*:{user_id}:*) |
| Admin updates catalog | Wait for TTL or manual purge | Redis (catalog:*), CDN |
| User uploads new photo | Purge specific image CDN URLs | CDN |
| User regenerates avatar | Purge avatar CDN URLs | CDN |
| Feature flag changed | Broadcast to all instances | In-memory (via Redis pub/sub) |
| Deployment | Purge CDN for all assets | CDN (on new release) |

### Cache-Warming Strategy

| Warmup Task | Trigger | Data Source | Target Cache |
|-------------|---------|-------------|--------------|
| Warm popular garment cache | Cron (every 5 min) | Top 100 garments by views | Redis |
| Warm catalog cache | Cron (every hour) | Full garment catalog | Redis |
| Warm user session on login | On user login | User recent data | Redis |
| Warm AI detection results | On image upload (background) | AI pipeline results | Redis |
| Warm search suggestions | Cron (every 10 min) | Popular search terms | Redis |

### Cache Size Estimates

Redis Memory Budget:
- Session data:      500 MB  (500K users x 1 KB)
- User profiles:     250 MB  (50K active users x 5 KB)
- Garment cache:     500 MB  (100K garments x 5 KB each)
- Search cache:      100 MB  (variable)
- Recommendation:    100 MB  (50K cached results x 2 KB)
- AI results:        200 MB  (40K results x 5 KB)
- Rate limiting:     50 MB   (counters with TTL)
- Feature flags:     1 MB
- Queue data:        100 MB
- Overhead:          200 MB

Total budget:        ~2 GB
Redis maxmemory:     2 GB with maxmemory-policy allkeys-lru

---

## Database Query Optimization

### Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | idx_users_email | UNIQUE BTREE | Login by email |
| users | idx_users_created_at | BTREE | User list sorting |
| garments | idx_garments_user_id | BTREE | User wardrobe queries |
| garments | idx_garments_category | BTREE | Category filtering |
| garments | idx_garments_user_category | COMPOSITE BTREE | User + category filter |
| garments | idx_garments_created_at | BTREE | Sort by recent |
| garments | idx_garments_search | GIN (trigram) | Full-text search |
| garments | idx_garments_color | BTREE | Color filtering |
| garments | idx_garments_size | BTREE | Size filtering |
| garments | idx_garments_brand | BTREE | Brand filtering |
| outfits | idx_outfits_user_id | BTREE | User outfit queries |
| outfits | idx_outfits_created_at | BTREE | Sort by recent |
| outfit_items | idx_outfit_items_outfit_id | BTREE | Outfit contents lookup |
| outfit_items | idx_outfit_items_garment_id | BTREE | Garment usage lookup |
| ai_detections | idx_ai_detections_image_id | BTREE | Detection lookup |
| ai_detections | idx_ai_detections_user_id | BTREE | User detection history |
| sessions | idx_sessions_user_id | BTREE | User sessions lookup |
| sessions | idx_sessions_expires_at | BTREE | Session cleanup queries |
| activity_logs | idx_activity_logs_user_id | BTREE | User activity history |
| activity_logs | idx_activity_logs_created_at | BTREE | Time-based queries |

### Query Optimization Techniques

1. **N+1 Query Prevention**: Use DataLoader for batched queries, eager loading with JOINs, monitor query count per request
2. **Index-Only Scans**: Design covering indexes for frequent query patterns
3. **Partial Indexes**: Index only active/visible records (e.g., `WHERE is_active = true`)
4. **Composite Index Column Order**: Most selective column first
5. **Query Rewriting**: Avoid SELECT *, use LIMIT/OFFSET with ordering, replace subqueries with JOINs
6. **Connection Pooling**: Use PgBouncer, pool size = CPU cores * 2 + disk spindles

### Database Performance Monitoring

```sql
-- Top 10 slowest queries
SELECT queryid, query, mean_exec_time, max_exec_time, calls, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- Index usage statistics
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC LIMIT 20;

-- Table access statistics
SELECT schemaname, tablename, seq_scan, idx_scan, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY seq_scan DESC LIMIT 10;
```

---

## Image Optimization Pipeline

### Upload Processing Pipeline

```
[User Upload] --> [Format Validation] --> [Resize + Crop] --> [Compression] --> [Cloudinary]

  Allowed formats: JPEG, PNG, WebP, AVIF
  Max input size: 20MB
  Max resolution: 4096x4096

  Thumbnail:     150x150, WebP, quality 80, fit=cover
  Medium:        600x600, WebP, quality 85, fit=inside
  Full:          1200x1200, WebP, quality 90, fit=inside
  Original:      Kept as-is (Cloudinary backup)
```

### Image Optimization Settings (Cloudinary)

Responsive image delivery with Cloudinary:
- format: auto (delivers WebP/AVIF when supported)
- quality: auto (perceptual quality optimization)
- dpr: auto (serves @2x for Retina displays)
- fetch_format: auto

### Client-Side Image Optimization

- Lazy loading: loading="lazy" attribute on images
- Responsive images: picture element with multiple sources
- Aspect ratio containers: Reserve space to prevent CLS
- BlurHash: Show blur placeholder while image loads (20x20px encoded string)
- Progressive loading: Use progressive JPEG for smoother perceived load
- Preload critical images: link rel=preload for hero images

### Image CDN Configuration (Cloudinary)

| Setting | Value | Reason |
|---------|-------|--------|
| Image CDN | Cloudinary | Global CDN with image optimization |
| Cache TTL | 7 days (images), 1 year (transformed) | Balance freshness vs. performance |
| Cache-Control | public, max-age=604800, immutable | Max browser caching |
| Purge on update | Yes | Cloudinary API invalidation |
| DPR support | auto | Serve @2x/3x for high-DPI screens |
| Format negotiation | auto | WebP/AVIF when browser supports |
| Compression | auto:best | Perceptual quality optimization |

---

## Code Splitting Strategy

### Route-Based Splitting

Next.js pages are automatically code-split by route. Dynamic imports are used for heavy components:

- pages/wardrobe.tsx (auto code-split)
- pages/virtual-tryon.tsx (auto code-split)
- AvatarViewer: dynamic import, ssr disabled (Three.js requires browser APIs)
- AIAnalysisPanel: dynamic import, loading skeleton

### Component-Based Splitting

Heavy libraries are split at the component level:
- ColorPicker: dynamic import
- ImageEditor: dynamic import
- SizeChart: dynamic import
- ShareDialog: dynamic import
- ExportButton: dynamic import
- AnalyticsDashboard: dynamic import

### Library Splitting

- Three.js and related libraries: dynamic import, ssr: false
- Charting libraries: dynamic import

### Vendor Bundle Splitting (webpack)

Cache groups for optimized chunking:
- vendor-react: react, react-dom
- vendor-three: three, @react-three/fiber, @react-three/drei
- vendor-ui: @headlessui, @heroicons, framer-motion
- common: shared across multiple routes

---

## Lazy Loading Strategy

| Asset Type | Loading Strategy | Trigger |
|------------|-----------------|---------|
| Below-fold images | Native lazy loading | Intersection Observer |
| 3D viewer (avatar, try-on) | Dynamic import + lazy | When user navigates to virtual try-on |
| AI analysis results | Dynamic import | When upload completes |
| Outfit recommendation panel | Dynamic import | After wardrobe loads |
| Search results | Paginated fetch | On search submit or scroll |
| Charts and analytics | Dynamic import | On dashboard navigation |
| Share dialogs / modals | Dynamic import | On button click |
| Font files | Preload critical, lazy non-critical | On page load / on demand |
| Service worker | Register after load | After window load event |
| WebSocket connection | Establish on user interaction | After login or page interaction |

---

## Bundle Size Monitoring

### CI Enforcement

Bundle size is checked on every pull request using size-limit. Configuration targets:

| Bundle | Limit |
|--------|-------|
| Home page JS | <200 KB |
| Wardrobe page JS | <150 KB |
| Virtual try-on JS | <200 KB |
| Total CSS | <50 KB |
| Framework JS | <80 KB |
| Three.js vendor bundle | <150 KB |

### size-limit Configuration

```json
{
  "size-limit": [
    { "path": ".next/static/chunks/pages/index-*.js", "limit": "200 KB" },
    { "path": ".next/static/chunks/pages/wardrobe-*.js", "limit": "150 KB" },
    { "path": ".next/static/chunks/pages/virtual-tryon-*.js", "limit": "200 KB" },
    { "path": ".next/static/css/*.css", "limit": "50 KB" },
    { "path": ".next/static/chunks/framework-*.js", "limit": "80 KB" },
    { "path": ".next/static/chunks/vendor-three-*.js", "limit": "150 KB" }
  ]
}
```

---

## Web Vitals Optimization

### LCP (Largest Contentful Paint) < 2.5s

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| Preload hero image | High | link rel=preload as=image |
| Optimize critical CSS | High | Inline critical CSS, defer non-critical |
| Minimize render-blocking resources | High | Defer JS, inline small CSS |
| Optimize TTFB | High | CDN, caching, server optimization |
| Preconnect to origins | Medium | link rel=preconnect to Cloudinary |
| Use HTTP/2 or HTTP/3 | Medium | Enable on CDN and server |
| Optimize images | High | Responsive images, modern formats |
| Server-side rendering (SSR) | Medium | Next.js SSR for key pages |

### FID (First Input Delay) < 100ms

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| Code splitting | High | Route-based and component-based splitting |
| Minimize main thread work | High | Defer non-critical JS to idle time |
| Use web workers | Medium | Offload heavy computation |
| Optimize event handlers | Medium | Debounce, throttle, passive listeners |
| Reduce third-party script impact | Medium | Async/defer loading, self-host critical |

### CLS (Cumulative Layout Shift) < 0.1

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| Set explicit image dimensions | High | Always include width/height on images |
| Reserve space for dynamic content | High | Skeleton loaders with fixed dimensions |
| Reserve space for fonts | High | font-display: optional with size-adjust |
| Reserve space for embeds | Medium | Fixed aspect ratio containers |
| Avoid inserting content above existing content | Medium | Use transform animations |

---

## Performance Budget Enforcement

### CI Pipeline Gates

| Gate | Metric | Pass | Warn | Fail |
|------|--------|------|------|------|
| Lighthouse Performance Score | Perf score | >90 | >80 | <80 |
| Lighthouse LCP | LCP | <2.5s | <4s | >4s |
| Lighthouse CLS | CLS | <0.1 | <0.25 | >0.25 |
| Lighthouse TBT | Total Blocking Time | <200ms | <500ms | >500ms |
| Bundle size (initial) | Initial JS | <200KB | <250KB | >250KB |
| Bundle size (total) | Total JS | <500KB | <600KB | >600KB |
| Bundle size (CSS) | CSS | <50KB | <60KB | >60KB |
| API latency (mixed workload) | p95 response | <200ms | <500ms | >500ms |
| API error rate (mixed workload) | Error % | <1% | <2% | >2% |
| Database query time (p95) | p95 query | <100ms | <200ms | >200ms |

### Performance Regression Response

| Severity | Response | Action |
|----------|----------|--------|
| Pass but degraded (>10% worse) | Note | Create ticket to investigate |
| Warning threshold crossed | Alert | Block merge, investigate before next deploy |
| Failure threshold crossed | Block | Immediate investigation, rollback if in production |

---

## Performance Monitoring & Alerting

### Continuous Monitoring

| Measure | Tool | Dashboard | Alert |
|---------|------|-----------|-------|
| API response times | Grafana (from metrics) | API Performance | Yes (>200ms p95) |
| Web Vitals | Vercel Analytics + RUM | Web Vitals Dashboard | Yes (LCP >4s for 5% of users) |
| Bundle size | size-limit CI | CI Artifacts | Yes (on PR) |
| Database performance | pg_stat_statements + Grafana | Database Dashboard | Yes (slow query increase) |
| Cache hit rates | Redis metrics + Grafana | Cache Dashboard | Yes (<70% hit rate) |
| CDN performance | Cloudinary analytics | CDN Dashboard | Yes (miss ratio increase) |
| Frontend errors | Sentry | Error Dashboard | Yes (error rate increase) |

### Performance Alert Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| high-api-latency | p95 > 500ms for 5 minutes | HIGH | Investigate endpoints, check DB |
| slow-page-load | LCP > 4s for >5% of users for 10 min | MEDIUM | Analyze RUM data, check CDN |
| high-db-latency | p95 query > 500ms for 5 minutes | HIGH | Check slow query log |
| increased-bundle-size | PR increases bundle > 10% | WARNING | Review PR, optimize bundle |
| low-cache-hit-rate | Redis hit rate < 70% for 15 minutes | MEDIUM | Review cache warming, check evictions |
| high-error-rate | API error rate > 5% for 3 minutes | CRITICAL | Immediate investigation |
| slow-ai-pipeline | AI pipeline p95 > 20s for 10 minutes | HIGH | Check GPU, queue depth |
