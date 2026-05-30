# ADR-004: Caching

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform must handle frequent read operations on garment catalogs, user profiles, outfit compositions, and AI analysis results while maintaining low latency. Specific caching requirements include: session storage for authenticated user state across multiple server instances, rate limiting for API endpoints to prevent abuse of AI inference endpoints, pub/sub messaging for cache invalidation when garment inventory updates occur, temporary storage for AI processing results, and reduction of database load for high-traffic catalog pages.

## DECISION
We will use **Redis** as the caching and pub/sub layer.

Redis provides an in-memory data store with the data structures needed for this project: key-value for session data and API caches, sorted sets for leaderboards and trending outfits, pub/sub channels for real-time cache invalidation and cross-instance communication, and TTL-based expiration for automated cache invalidation. Redis' atomic operations support rate limiting via sliding window counters with minimal overhead.

Specific use cases:
- **Session storage** — JWT refresh token blacklist, temporary session data
- **API response cache** — Garment catalog pages, outfit thumbnails, AI style recommendations (TTL: 5-60 minutes)
- **Rate limiting** — Per-user and per-IP counters for AI inference endpoints, garment upload limits
- **Pub/sub** — Cache invalidation across horizontal backend instances when garment data is updated
- **Job queue** — Lightweight task queuing for AI analysis jobs, image processing pipelines

## CONSEQUENCES

**Positive:**
- Sub-millisecond read/write latency for session and cache lookups
- Atomic operations enable accurate rate limiting without race conditions
- Pub/sub channels enable real-time cache invalidation across all backend instances
- Multiple data structures cover all caching and lightweight queueing needs
- Well-supported by NestJS (@nestjs/bull, ioredis) and Node.js ecosystem
- Redis Stack (RedisJSON, RediSearch) could extend capabilities if needed

**Negative:**
- Additional infrastructure component to deploy and monitor
- Memory-bound — cached data size limited by available RAM, requiring careful TTL management
- No persistence guarantees — data loss acceptable for cache but requires fallback for queue durability
- Cache invalidation complexity — stale data risks in catalog caching require careful invalidation strategy
- Network latency to Redis becomes bottleneck if not co-located with application instances

## ALTERNATIVES CONSIDERED

### Memcached
- **Pros:** Simpler, lower memory overhead, well-tested for basic caching
- **Cons:** No data structure variety (key-value only), no pub/sub, no persistence, no atomic operations for rate limiting, limited to 1MB key size

### In-memory caching (Node.js process memory)
- **Pros:** Zero network latency, simplest to implement, no additional infrastructure
- **Cons:** Not shared across instances — cache inconsistency with horizontal scaling, memory competes with application heap, cache lost on process restart, no pub/sub for cross-instance communication

### CDN caching (Cloudinary/Vercel Edge)
- **Pros:** Excellent for static assets and rendered pages, globally distributed, no origin load
- **Cons:** Only suitable for cacheable content (garment images, static pages), no support for session storage, rate limiting, or pub/sub, long TTL granularity, no cache invalidation control for authenticated content

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, DevOps Engineer, Tech Lead
