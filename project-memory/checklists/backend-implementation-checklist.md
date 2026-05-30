# Backend Implementation Checklist

## Project Setup
- [ ] Initialize NestJS project with `@nestjs/cli`
- [ ] Configure TypeScript strict mode in `tsconfig.json`
- [ ] Set up ESLint and Prettier configuration
- [ ] Create environment variable validation with Joi/Zod
- [ ] Configure database connection module (TypeORM/Prisma with PostgreSQL)
- [ ] Set up Supabase client configuration
- [ ] Configure Redis connection module
- [ ] Set up logging system (Winston or Pino)
- [ ] Create project folder structure (modules, common, config, shared)
- [ ] Set up Docker Compose for local development (PostgreSQL, Redis)
- [ ] Configure CORS for frontend origins
- [ ] Set up global validation pipe
- [ ] Configure Swagger/OpenAPI documentation
- [ ] Set up env files (.env, .env.dev, .env.staging, .env.prod)
- [ ] Create health check endpoint (`GET /health`)
- [ ] Add request ID middleware for tracing
- [ ] Configure Sentry or error tracking integration
- [ ] Set up commit hooks (husky, lint-staged)
- [ ] Create database migration scripts

## Database Schema
- [ ] Create `users` table (id, email, password_hash, name, avatar_url, skin_tone, body_measurements JSON, preferences JSON, created_at, updated_at)
- [ ] Create `garments` table (id, user_id FK, name, type, category, subcategory, color, color_hex, pattern, material, brand, size, condition, purchase_date, price, image_url, thumbnail_url, background_removed_url, season, occasion, favorite boolean, times_worn, tags JSON, metadata JSON, created_at, updated_at)
- [ ] Create `outfits` table (id, user_id FK, name, description, occasion, season, style, garments JSON (ordered list of garment IDs with position data), image_url, thumbnail_url, favorite boolean, times_worn, tags JSON, created_at, updated_at)
- [ ] Create `calendar_events` table (id, user_id FK, outfit_id FK nullable, title, description, date, start_time, end_time, repeat_type (none/daily/weekly/monthly), repeat_until, color, location, weather_forecast JSON, created_at, updated_at)
- [ ] Create `avatar` table (id, user_id FK unique, avatar_url, glb_model_url, ready_player_me_url, customization JSON (body, face, hair, outfit), last_synced_at, created_at, updated_at)
- [ ] Create `notifications` table (id, user_id FK, type, title, body, data JSON, read boolean, sent_at, read_at)
- [ ] Create `notification_tokens` table (id, user_id FK, token, device_type, created_at)
- [ ] Create `analytics_events` table (id, user_id FK nullable, event_type, event_data JSON, page, session_id, timestamp)
- [ ] Create `garment_interactions` table (id, user_id FK, garment_id FK, interaction_type (view/wear/favorite/share), timestamp)
- [ ] Create `outfit_interactions` table (id, user_id FK, outfit_id FK, interaction_type (view/wear/favorite/share), timestamp)
- [ ] Create `saved_searches` table (id, user_id FK, query, filters JSON, created_at)
- [ ] Create `export_history` table (id, user_id FK, export_type, format, file_url, status, created_at)
- [ ] Create `refresh_tokens` table (id, user_id FK, token_hash, expires_at, created_at)
- [ ] Add proper indexes on foreign keys, user_id, date fields, and frequently queried columns
- [ ] Add composite indexes for common query patterns (e.g., user_id + category, user_id + date)
- [ ] Set up cascade deletes where appropriate
- [ ] Create database migration files for all tables
- [ ] Add row-level security policies for Supabase (if using Supabase)
- [ ] Create seed scripts for development/testing data

## Authentication
- [ ] Create users table with proper constraints (unique email, minimum password length)
- [ ] Implement password hashing with bcrypt (salt rounds 12)
- [ ] Create `POST /auth/register` endpoint (email, password, name, optional body_measurements)
- [ ] Create `POST /auth/login` endpoint (email, password -> access_token, refresh_token)
- [ ] Implement JWT generation (access token: 15min, refresh token: 7d)
- [ ] Create JWT authentication guard
- [ ] Create `POST /auth/refresh` endpoint (refresh token -> new access + refresh tokens)
- [ ] Create `POST /auth/logout` endpoint (invalidate refresh token)
- [ ] Create `POST /auth/forgot-password` endpoint (send reset email)
- [ ] Create `POST /auth/reset-password` endpoint (token validation + new password)
- [ ] Create `POST /auth/change-password` endpoint (authenticated user)
- [ ] Create `GET /auth/profile` endpoint (current user info)
- [ ] Create `PUT /auth/profile` endpoint (update name, avatar, preferences)
- [ ] Implement refresh token rotation (invalidate old on refresh)
- [ ] Add rate limiting to auth endpoints (5 attempts per minute per IP)
- [ ] Implement account lockout after 5 failed attempts (15 min cooldown)
- [ ] Add email verification flow (send verification email, verify endpoint)
- [ ] Implement OAuth2/social login stubs (Google, Apple) if required
- [ ] Add device tracking to login responses
- [ ] Test auth flow: register -> login -> access protected route -> refresh -> logout
- [ ] Write unit tests for auth service (register, login, refresh, token validation)
- [ ] Write e2e tests for auth endpoints

## Garment CRUD
- [ ] Create `POST /garments` endpoint (create garment with image upload)
- [ ] Create `GET /garments` endpoint (list user garments with pagination, filtering, sorting)
- [ ] Create `GET /garments/:id` endpoint (single garment detail)
- [ ] Create `PUT /garments/:id` endpoint (update garment fields)
- [ ] Create `DELETE /garments/:id` endpoint (soft delete, remove images from storage)
- [ ] Create `PATCH /garments/:id/favorite` endpoint (toggle favorite)
- [ ] Create `POST /garments/:id/wear` endpoint (increment times_worn, log interaction)
- [ ] Create `GET /garments/stats` endpoint (count by category, color, brand, etc.)
- [ ] Create `POST /garments/batch` endpoint (batch create from AI scan)
- [ ] Create `DELETE /garments/batch` endpoint (batch delete)
- [ ] Create `PUT /garments/:id/tags` endpoint (update tags)
- [ ] Implement filtering by: category, subcategory, color, season, occasion, brand, size, date range, favorite, tags
- [ ] Implement sorting by: name, date, times_worn, color
- [ ] Implement pagination (cursor-based or offset, configurable page size)
- [ ] Support search by garment name, brand, tags
- [ ] Upload garment image to Cloudinary (generate optimized versions)
- [ ] Process image through AI pipeline after upload (trigger async job)
- [ ] Implement image validation (max size 10MB, allowed formats: JPEG, PNG, WebP)
- [ ] Add request validation for all inputs
- [ ] Write unit tests for garment service
- [ ] Write e2e tests for garment endpoints

## Outfit CRUD
- [ ] Create `POST /outfits` endpoint (create outfit with selected garment IDs and layout data)
- [ ] Create `GET /outfits` endpoint (list outfits with pagination, filtering, sorting)
- [ ] Create `GET /outfits/:id` endpoint (single outfit with all garment details)
- [ ] Create `PUT /outfits/:id` endpoint (update outfit fields, add/remove garments)
- [ ] Create `DELETE /outfits/:id` endpoint (soft delete)
- [ ] Create `PATCH /outfits/:id/favorite` endpoint (toggle favorite)
- [ ] Create `POST /outfits/:id/wear` endpoint (increment times_worn, log interaction)
- [ ] Create `POST /outfits/:id/screenshot` endpoint (generate outfit image)
- [ ] Create `POST /outfits/:id/generate-name` endpoint (AI suggestion for outfit name)
- [ ] Create `GET /outfits/suggestions` endpoint (AI outfit recommendations based on weather/occasion)
- [ ] Create `POST /outfits/from-garments` endpoint (create outfit from selected garment IDs)
- [ ] Implement validation: no duplicate garment types (e.g., two tops)
- [ ] Validate garment ownership (user can only use their own garments)
- [ ] Add outfit image generation (composite of garment images)
- [ ] Write unit tests for outfit service
- [ ] Write e2e tests for outfit endpoints

## Avatar System
- [ ] Create `GET /avatar` endpoint (get current user avatar data)
- [ ] Create `PUT /avatar` endpoint (update avatar customization JSON)
- [ ] Create `POST /avatar/upload-glb` endpoint (upload custom 3D model)
- [ ] Create `POST /avatar/ready-player-me` endpoint (save Ready Player Me URL)
- [ ] Create `POST /avatar/detect-body` endpoint (process body measurement image)
- [ ] Create `GET /avatar/measurements` endpoint (get body measurements)
- [ ] Create `PUT /avatar/measurements` endpoint (update body measurements manually)
- [ ] Create `POST /avatar/try-on/:garmentId` endpoint (generate try-on preview)
- [ ] Create `GET /avatar/try-on/:outfitId` endpoint (generate full outfit try-on)
- [ ] Integrate with avatar generation pipeline (queue job, return status)
- [ ] Validate GLB file size and format (max 50MB, .glb binary)
- [ ] Store avatar 3D assets in Cloudinary/Google Drive
- [ ] Write unit tests for avatar service

## Calendar
- [ ] Create `GET /calendar/events` endpoint (list events with date range filtering)
- [ ] Create `POST /calendar/events` endpoint (create event, optionally link outfit)
- [ ] Create `GET /calendar/events/:id` endpoint (single event detail)
- [ ] Create `PUT /calendar/events/:id` endpoint (update event)
- [ ] Create `DELETE /calendar/events/:id` endpoint (delete event)
- [ ] Create `PATCH /calendar/events/:id/outfit` endpoint (link/unlink outfit to event)
- [ ] Create `GET /calendar/events/:date` endpoint (events for specific date)
- [ ] Create `POST /calendar/events/recurring` endpoint (create recurring event series)
- [ ] Implement recurring event expansion (generate instances for date range)
- [ ] Add weather forecast integration (fetch and store with event)
- [ ] Add outfit suggestion for events without linked outfit
- [ ] Validate date/time ranges (end after start, no overlaps for same user)
- [ ] Write unit tests for calendar service

## Notifications
- [ ] Create `POST /notifications/token` endpoint (register FCM device token)
- [ ] Create `DELETE /notifications/token/:token` endpoint (unregister device token)
- [ ] Create `GET /notifications` endpoint (list user notifications with pagination)
- [ ] Create `GET /notifications/unread-count` endpoint (unread notification count)
- [ ] Create `PATCH /notifications/:id/read` endpoint (mark as read)
- [ ] Create `PATCH /notifications/read-all` endpoint (mark all as read)
- [ ] Create `DELETE /notifications/:id` endpoint (delete notification)
- [ ] Create `POST /notifications/send-test` endpoint (send test notification to device)
- [ ] Implement notification sending service (Firebase Cloud Messaging)
- [ ] Implement background job for sending push notifications
- [ ] Create notification templates (outfit reminder, wardrobe suggestion, etc.)
- [ ] Implement notification scheduling (remind about event N hours before)
- [ ] Add notification preferences per user (opt-in/out per type)
- [ ] Implement rate limiting for notifications (max N per hour per user)
- [ ] Write unit tests for notification service

## Analytics
- [ ] Create `POST /analytics/events` endpoint (ingest client-side events)
- [ ] Create `POST /analytics/events/batch` endpoint (batch event ingestion)
- [ ] Create `GET /analytics/dashboard` endpoint (dashboard summary stats)
- [ ] Create `GET /analytics/wardrobe` endpoint (wardrobe statistics - counts by category, color, brand, season)
- [ ] Create `GET /analytics/wearing` endpoint (wearing patterns - most worn, least worn, frequency)
- [ ] Create `GET /analytics/spending` endpoint (spending analytics - by month, brand, category)
- [ ] Create `GET /analytics/seasonal` endpoint (seasonal trends analysis)
- [ ] Create `GET /analytics/outfit-frequency` endpoint (outfit creation/wearing frequency)
- [ ] Implement event aggregation pipeline (daily/hourly rollups)
- [ ] Store raw events in separate analytics table with TTL
- [ ] Implement anonymous analytics for unauthenticated users
- [ ] Add GDPR consent check for analytics tracking
- [ ] Write unit tests for analytics service

## Storage
- [ ] Configure Cloudinary upload SDK with secure API credentials
- [ ] Implement file upload middleware (multer or busboy)
- [ ] Create image upload service (upload to Cloudinary, generate URLs)
- [ ] Implement image transformations (resize, crop, format conversion)
- [ ] Create file deletion service (remove from Cloudinary)
- [ ] Implement signed URL generation for private assets
- [ ] Add Google Drive backup integration for user data exports
- [ ] Configure webhook handlers for Cloudinary upload events
- [ ] Implement image optimization pipeline (convert to WebP, set quality)
- [ ] Implement thumbnail generation on upload (256x256, 512x512)
- [ ] Create `POST /storage/upload` endpoint (generic file upload)
- [ ] Create `POST /storage/upload-garment` endpoint (garment-specific upload with AI trigger)
- [ ] Create `GET /storage/url/:id` endpoint (get signed URL for private file)
- [ ] Implement file type validation (mime type checking, magic bytes)
- [ ] Implement file size limits (configurable per file type)
- [ ] Add virus scanning for uploaded files
- [ ] Implement cleanup job for orphaned files
- [ ] Write tests for storage service

## Export
- [ ] Create `POST /export/wardrobe` endpoint (export wardrobe as CSV/JSON/PDF)
- [ ] Create `POST /export/outfits` endpoint (export outfits as CSV/JSON/PDF)
- [ ] Create `POST /export/analytics` endpoint (export analytics report as PDF)
- [ ] Create `POST /export/backup` endpoint (export all user data - GDPR request)
- [ ] Create `GET /export/status/:jobId` endpoint (check export job status)
- [ ] Create `GET /export/download/:jobId` endpoint (download completed export)
- [ ] Create `DELETE /export/:jobId` endpoint (delete export file)
- [ ] Implement background job processing for large exports
- [ ] Implement export file cleanup (auto-delete after 7 days)
- [ ] Add format-specific generators (CSV, JSON, PDF)
- [ ] Implement PDF generation with formatted layouts
- [ ] Add file size validation for exports
- [ ] Write tests for export service

## WebSocket
- [ ] Set up Socket.IO gateway in NestJS
- [ ] Implement WebSocket authentication (JWT token in handshake)
- [ ] Create `garment:updated` event (notify when garment is modified)
- [ ] Create `outfit:updated` event (notify when outfit is modified)
- [ ] Create `avatar:updated` event (notify when avatar is modified)
- [ ] Create `ai:processing` event (notify AI job status)
- [ ] Create `ai:completed` event (notify AI job completion)
- [ ] Create `ai:error` event (notify AI job failure)
- [ ] Create `notification:new` event (push notification in real-time)
- [ ] Create `export:completed` event (notify export job completion)
- [ ] Implement room management (user-specific rooms)
- [ ] Implement connection tracking (online status, last seen)
- [ ] Add reconnection logic with backoff
- [ ] Implement heartbeat mechanism (ping/pong every 30s)
- [ ] Add rate limiting for WebSocket messages
- [ ] Handle disconnection gracefully (cleanup rooms, update status)
- [ ] Write tests for WebSocket gateway

## Middleware
- [ ] Implement request logging middleware (method, URL, duration, status)
- [ ] Implement rate limiting middleware (token bucket per IP/user)
- [ ] Implement request validation middleware (class-validator with whitelist)
- [ ] Implement response compression middleware
- [ ] Implement helmet middleware for security headers
- [ ] Implement CORS middleware (configured origins, methods, headers)
- [ ] Implement request ID middleware (X-Request-Id header)
- [ ] Implement timeout middleware (configurable timeout per route)
- [ ] Implement payload size limiting middleware
- [ ] Implement CSRF protection middleware (double-submit cookie pattern)
- [ ] Implement device detection middleware (parse user-agent)
- [ ] Implement locale detection middleware (Accept-Language header)
- [ ] Implement API versioning middleware (URL prefix or header)
- [ ] Write tests for each middleware

## Caching
- [ ] Configure Redis cache module in NestJS
- [ ] Implement cache interceptor for GET endpoints
- [ ] Set cache TTLs per endpoint type (garments: 5min, outfits: 5min, stats: 1h)
- [ ] Implement cache invalidation on related mutations (update garment -> clear garment cache)
- [ ] Cache user profile data (TTL: 10min)
- [ ] Cache wardrobe statistics (TTL: 1h, invalidated on garment change)
- [ ] Cache frequently accessed reference data (categories, colors)
- [ ] Implement distributed locks for concurrent operations
- [ ] Add cache tags for group invalidation
- [ ] Implement cache warming for common queries
- [ ] Add cache hit/miss metrics
- [ ] Implement circuit breaker for Redis failures (fallback to DB)
- [ ] Write tests for caching layer

## Security
- [ ] Implement rate limiting on all endpoints (graduated: 100/min -> 10/min -> 1/min)
- [ ] Add request size limits (max 1MB for JSON, 10MB for uploads)
- [ ] Implement SQL injection prevention (parameterized queries via ORM)
- [ ] Add XSS prevention (input sanitization, output encoding)
- [ ] Implement CSRF protection for state-changing requests
- [ ] Add HTTP security headers (helmet: CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Implement proper password policies (min 8 chars, mixed case, number, special)
- [ ] Add account lockout mechanism (5 failed attempts -> 15min lockout)
- [ ] Implement session management (token blacklist on logout)
- [ ] Add API key validation for internal service communication
- [ ] Implement proper error responses (no stack traces, no internal details)
- [ ] Add request validation with whitelist (strip unknown properties)
- [ ] Implement proper CORS (specific origins, not wildcard in production)
- [ ] Add dependency vulnerability scanning (npm audit, Snyk)
- [ ] Implement secrets management (env vars, not in code)
- [ ] Add security headers check endpoint for testing
- [ ] Write security tests (OWASP ZAP or similar)

## Testing
- [ ] Set up Jest configuration for NestJS
- [ ] Configure test database (separate PostgreSQL database for tests)
- [ ] Create test factories for all entities
- [ ] Write unit tests for all services (auth, garment, outfit, avatar, calendar, notification, analytics, storage, export)
- [ ] Write unit tests for all guards (JWT auth, roles)
- [ ] Write unit tests for all pipes and filters
- [ ] Write unit tests for all interceptors
- [ ] Write unit tests for custom decorators
- [ ] Write integration tests for all controllers/endpoints
- [ ] Write e2e tests for complete flows (register -> login -> CRUD garments -> CRUD outfits -> logout)
- [ ] Write WebSocket gateway tests
- [ ] Test database migrations (up and down)
- [ ] Test error handling (404, 401, 403, 409, 422, 429, 500)
- [ ] Test pagination, filtering, sorting on list endpoints
- [ ] Test file upload validation (wrong type, too large, corrupted)
- [ ] Test rate limiting (exceed limits, verify cooldown)
- [ ] Test authentication edge cases (expired token, invalid token, missing token)
- [ ] Test concurrent requests (race conditions, optimistic locking)
- [ ] Achieve minimum 80% code coverage
- [ ] Set up CI pipeline to run tests on every PR

## Documentation
- [ ] Document all endpoints with Swagger/OpenAPI decorators
- [ ] Add request/response examples for each endpoint
- [ ] Document authentication flow (register, login, refresh, logout)
- [ ] Document error codes and error response format
- [ ] Document rate limiting headers and behavior
- [ ] Create API changelog
- [ ] Add environment setup instructions in README
- [ ] Document database schema with ER diagram
- [ ] Document WebSocket events and payloads
- [ ] Document caching strategy
- [ ] Document deployment process
- [ ] Create Postman/Insomnia collection for API testing
