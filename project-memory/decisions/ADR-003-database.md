# ADR-003: Database

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires a database capable of managing complex relational data: garments with attributes (size, color, material, category, brand), user profiles with preferences and body measurements, outfits composed of multiple garments, user-generated collections, AI analysis results (style predictions, fit recommendations), and social interactions (follows, likes, comments). The data model is inherently relational — garments belong to categories, outfits contain garments, users own garments and create outfits. Additionally, the platform needs row-level security for multi-tenant data isolation, realtime subscriptions for collaborative features, and minimal operational overhead during early development.

## DECISION
We will use **PostgreSQL via Supabase** as the primary database.

Supabase provides a managed PostgreSQL instance with additional capabilities that directly map to project requirements: Row-Level Security (RLS) for user data isolation, realtime subscriptions for WebSocket-based features, built-in REST and GraphQL APIs, authentication integration, and storage integration. PostgreSQL's relational model perfectly fits the garment-outfit-user schema with foreign key constraints, JSON/JSONB columns for flexible attributes (garment metadata, body measurements), and full-text search for catalog queries.

Key schema domains:
- **Users & Profiles** — accounts, preferences, body measurements, style profiles
- **Garments** — catalog items with SKU, attributes (size, color, material, category, brand), images, 3D model references, AI analysis metadata
- **Outfits** — composed garments, user creator, visibility, occasion tagging
- **Collections** — user-curated groupings of outfits and garments
- **Interactions** — follows, likes, comments, shared outfits
- **AI Jobs** — analysis queue, results, model version tracking

## CONSEQUENCES

**Positive:**
- Relational integrity ensures consistent garment-outfit-user relationships
- RLS provides fine-grained multi-tenant security at the database level, reducing application-layer auth checks
- Supabase Realtime enables live updates for collaborative features without additional infrastructure
- Managed service eliminates database administration overhead during early stages
- PostgreSQL JSON/JSONB columns allow schema flexibility for evolving garment attribute models
- Full-text search (tsvector) handles catalog search without external search service dependency

**Negative:**
- Supabase vendor lock-in for managed features (RLS policies, realtime, auth) — migration to raw PostgreSQL requires replacing these layers
- RLS policy complexity can grow with intricate authorization rules, potentially impacting query performance
- Supabase free/pro tier connections limits may require connection pooling at scale
- Realtime feature limitations (no message persistence, no guaranteed delivery) may require Socket.IO for critical features
- PostgreSQL horizontal scaling (read replicas, sharding) is more complex than some NoSQL alternatives

## ALTERNATIVES CONSIDERED

### MySQL
- **Pros:** Mature, widely deployed, good performance for read-heavy workloads
- **Cons:** Weaker JSON support than PostgreSQL, no native RLS, no built-in realtime subscriptions, less advanced indexing for full-text search

### MongoDB
- **Pros:** Schema flexibility, horizontal scaling via sharding, rich query language for nested documents
- **Cons:** Poor fit for relational garment-outfit-user model — would require manual reference management and denormalization, no joins, no transactions across collections (or multi-document transactions with performance cost), less mature search capabilities

### Firebase Firestore
- **Pros:** Real-time sync, managed NoSQL, easy client SDK integration, good for rapid prototyping
- **Cons:** No relational queries, poor for complex join-like operations, vendor lock-in, scaling costs unpredictable, limited query capabilities (no OR, no `!=`), no full-text search, document size limits (1MB) could restrict garment data with embedded images metadata

### Prisma + PostgreSQL (self-hosted)
- **Pros:** Type-safe ORM, excellent developer experience, auto-generated TypeScript types, strong migration system
- **Cons:** No managed database — requires self-hosting or separate DBaaS, no built-in RLS or realtime, no authentication layer, Supabase provides all this plus Prisma-compatible PostgreSQL underneath

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, Database Administrator, CTO
