# Services Layer

## Overview

All services follow Dependency Injection pattern via NestJS `@Injectable()` decorator.
Services log via `@nestjs/common` Logger, cache via Redis, and emit events via `EventEmitter2`.

---

## AuthService

**File:** `src/auth/auth.service.ts`

### Dependencies
- `UserService` - User CRUD
- `JwtService` - JWT token generation/verification
- `ConfigService` - JWT secrets, expiry config
- `Redis` - Token blacklist, refresh token storage
- `EventEmitter2` - User registered/login events
- `MailService` - Email verification

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `register` | `dto: RegisterDto` | `Promise<AuthResult>` | Create user, generate tokens, emit registered |
| `login` | `dto: LoginDto` | `Promise<AuthResult>` | Validate credentials, generate tokens |
| `refresh` | `token: string` | `Promise<Tokens>` | Validate refresh token, rotate pair |
| `logout` | `userId: string, refreshToken: string` | `Promise<void>` | Revoke tokens, clear Redis |
| `getProfile` | `userId: string` | `Promise<User>` | Get user with preferences and stats |
| `updateProfile` | `userId: string, dto: UpdateUserDto` | `Promise<User>` | Update user fields |
| `verifyEmail` | `token: string` | `Promise<void>` | Verify email address |
| `changePassword` | `userId: string, oldPassword: string, newPassword: string` | `Promise<void>` | Change password, invalidate sessions |
| `requestPasswordReset` | `email: string` | `Promise<void>` | Send reset link |
| `resetPassword` | `token: string, newPassword: string` | `Promise<void>` | Reset forgotten password |

### Private Methods

| Method | Description |
|--------|-------------|
| `generateTokens` | Create access + refresh JWT pair |
| `verifyRefreshToken` | Validate refresh token not revoked/expired |
| `revokeRefreshToken` | Mark token as revoked in DB + Redis |
| `hashPassword` | bcrypt hash with salt rounds 12 |
| `comparePassword` | bcrypt compare |
| `validateEmailUniqueness` | Check email not taken |

### Error Handling
- `BadRequestException` - Validation failures
- `UnauthorizedException` - Invalid credentials/tokens
- `ConflictException` - Email already registered
- `NotFoundException` - User not found

### Caching
- Blacklisted tokens in Redis with TTL matching token expiry
- User profile cached 5 minutes, invalidated on update

---

## UserService

**File:** `src/user/user.service.ts`

### Dependencies
- `PrismaService` / `Repository` - Database access
- `ConfigService` - Default preferences
- `EventEmitter2` - User lifecycle events

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findById` | `id: string` | `Promise<User>` | Get user by ID |
| `findByEmail` | `email: string` | `Promise<User | null>` | Get user by email |
| `create` | `data: CreateUserDto` | `Promise<User>` | Create user with preferences |
| `update` | `id: string, data: UpdateUserDto` | `Promise<User>` | Update user |
| `softDelete` | `id: string` | `Promise<void>` | Soft delete |
| `getPreferences` | `id: string` | `Promise<UserPreferences>` | Get preferences |
| `updatePreferences` | `id: string, data: Partial<UserPreferences>` | `Promise<UserPreferences>` | Update preferences |
| `getStats` | `id: string` | `Promise<UserStats>` | Aggregate garment/outfit/avatar counts |
| `getActiveSessions` | `id: string` | `Promise<number>` | Count active WebSocket sessions |

### Error Handling
- `NotFoundException` - User not found
- All operations check `deleted_at` to exclude soft-deleted records

### Caching
- User object cached 5 min in Redis: `user:{id}`
- Stats cached 1 min: `user:{id}:stats`
- Invalidated on user update or garment/outfit/avatar create/delete

---

## GarmentService

**File:** `src/garment/garment.service.ts`

### Dependencies
- `PrismaService` - Database access
- `StorageService` - Image upload
- `AiPipelineService` - Processing pipeline trigger
- `SearchService` - Full-text search
- `EventEmitter2` - Garment CRUD events
- `NotificationService` - Processing completion notification
- `Redis` - Processing status cache

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `userId: string, dto: CreateGarmentDto` | `Promise<Garment>` | Create garment record, emit created |
| `findById` | `id: string, userId: string` | `Promise<Garment>` | Get garment with images |
| `findAll` | `userId: string, filters: GarmentFilters` | `Promise<PaginatedResult<Garment>>` | Paginated, filtered list |
| `update` | `id: string, userId: string, dto: UpdateGarmentDto` | `Promise<Garment>` | Update fields, emit updated |
| `softDelete` | `id: string, userId: string` | `Promise<void>` | Soft delete, emit deleted |
| `search` | `userId: string, query: string, filters: SearchFilters` | `Promise<PaginatedResult<Garment>>` | Full-text search |
| `uploadImage` | `id: string, userId: string, file: Express.Multer.File` | `Promise<Garment>` | Upload + trigger pipeline |
| `getProcessingStatus` | `id: string, userId: string` | `Promise<ProcessingStatus>` | Get current pipeline status |
| `getByCategory` | `userId: string, category: GarmentCategory` | `Promise<Garment[]>` | Get garments by category |
| `getAvailable` | `userId: string` | `Promise<Garment[]>` | Get state=available garments |
| `getRecentlyUsed` | `userId: string, limit?: number` | `Promise<Garment[]>` | Get least recently worn |
| `updateWearCount` | `id: string` | `Promise<void>` | Increment wear count, set last_worn_at |
| `batchUpdateState` | `ids: string[], userId: string, state: GarmentState` | `Promise<void>` | Bulk state update |
| `getAnalytics` | `userId: string, dateFrom?: Date, dateTo?: Date` | `Promise<GarmentAnalytics>` | Aggregated analytics |

### Private Methods

| Method | Description |
|--------|-------------|
| `validateOwnership` | Verify garment belongs to userId |
| `validateImageFile` | Check mime type, dimensions, size |
| `processImageAsync` | Queue AI pipeline processing |
| `invalidateCache` | Clear Redis cache entries for user |

### Error Handling
- `NotFoundException` - Garment not found
- `ForbiddenException` - Not garment owner
- `BadRequestException` - Invalid file, validation
- `ConflictException` - Duplicate upload

### Caching Strategy
- Garment list: `garments:{userId}:{filtersHash}` TTL 2 min
- Single garment: `garment:{id}` TTL 5 min
- Available garments: `garments:{userId}:available` TTL 1 min
- Invalidated on create, update, delete, state change

---

## OutfitService

**File:** `src/outfit/outfit.service.ts`

### Dependencies
- `PrismaService` - Database access
- `GarmentService` - Garment validation
- `RecommendationEngine` - AI recommendations
- `RenderService` - Preview generation
- `EventEmitter2` - Outfit CRUD events
- `NotificationService` - Recommendation notifications
- `Redis` - Recommendation cache

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `userId: string, dto: CreateOutfitDto` | `Promise<Outfit>` | Create with garment validation |
| `findById` | `id: string, userId: string` | `Promise<Outfit>` | Get with full garments |
| `findAll` | `userId: string, filters: OutfitFilters` | `Promise<PaginatedResult<Outfit>>` | Paginated list |
| `update` | `id: string, userId: string, dto: UpdateOutfitDto` | `Promise<Outfit>` | Update + garment validation |
| `softDelete` | `id: string, userId: string` | `Promise<void>` | Soft delete |
| `generatePreview` | `id: string, userId: string` | `Promise<void>` | Queue preview generation |
| `getRecommendations` | `userId: string, preferences: RecommendationPrefs` | `Promise<RecommendationResult>` | AI recommendations |
| `getDailyOutfit` | `userId: string` | `Promise<DailyOutfit | null>` | Today's scheduled or recommended |
| `getByOccasion` | `userId: string, occasion: string` | `Promise<Outfit[]>` | Filter by occasion |
| `getBySeason` | `userId: string, season: Season` | `Promise<Outfit[]>` | Filter by season |
| `getAnalytics` | `userId: string, dateFrom?: Date, dateTo?: Date` | `Promise<OutfitAnalytics>` | Outfit statistics |
| `duplicateOutfit` | `id: string, userId: string` | `Promise<Outfit>` | Clone outfit |

### Private Methods

| Method | Description |
|--------|-------------|
| `validateGarments` | Check all garment IDs are owned and available |
| `validateSlotCompleteness` | Ensure at least upper + lower or dress |
| `buildRecommendation` | Score and rank outfit combinations |
| `rotateGarments` | Select least recently used garments |

### Error Handling
- `NotFoundException` - Outfit/garment not found
- `ForbiddenException` - Not owner
- `BadRequestException` - Invalid garment combination
- `ServiceUnavailableException` - AI service down

### Caching Strategy
- Outfit list: `outfits:{userId}:{filtersHash}` TTL 2 min
- Single outfit: `outfit:{id}` TTL 5 min
- Daily outfit: `outfit:{userId}:daily` TTL 1 hour
- Recommendations: `recommendations:{userId}:{contextHash}` TTL 30 min
- Invalidated on create, update, delete, garment state change

---

## AvatarService

**File:** `src/avatar/avatar.service.ts`

### Dependencies
- `PrismaService` - Database access
- `StorageService` - Video upload
- `AiPipelineService` - Avatar generation
- `RenderService` - Model optimization
- `NotificationService` - Generation completion
- `Redis` - Generation status

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `userId: string, dto: CreateAvatarDto` | `Promise<Avatar>` | Create avatar record |
| `findById` | `id: string, userId: string` | `Promise<Avatar>` | Get avatar with versions |
| `findAll` | `userId: string` | `Promise<Avatar[]>` | List all user avatars |
| `update` | `id: string, userId: string, dto: UpdateAvatarDto` | `Promise<Avatar>` | Update metadata |
| `delete` | `id: string, userId: string` | `Promise<void>` | Permanently delete |
| `generateFromVideo` | `id: string, userId: string, video: Express.Multer.File, options?: GenerationOptions` | `Promise<void>` | Queue AI generation |
| `getGenerationStatus` | `id: string, userId: string` | `Promise<GenerationStatus>` | Get progress |
| `setActive` | `id: string, userId: string` | `Promise<Avatar>` | Set as active avatar, deactivate others |
| `getActive` | `userId: string` | `Promise<Avatar | null>` | Get current active avatar |
| `getVersions` | `id: string, userId: string` | `Promise<AvatarVersion[]>` | List versions |
| `deleteVersion` | `avatarId: string, version: number, userId: string` | `Promise<void>` | Delete specific version |
| `checkLimit` | `userId: string` | `Promise<boolean>` | Check if user can create avatar |

### Private Methods

| Method | Description |
|--------|-------------|
| `enforceAvatarLimit` | Max 3 avatars per user |
| `enforceVersionLimit` | Max 3 versions per avatar |
| `validateVideo` | Check duration, resolution, size |
| `queueGeneration` | Send to AI pipeline |
| `notifyGenerationComplete` | Emit event + push notification |

### Error Handling
- `NotFoundException` - Avatar not found
- `ForbiddenException` - Not owner
- `BadRequestException` - Invalid video, limit exceeded
- `ConflictException` - Generation already in progress

### Caching Strategy
- Avatar list: `avatars:{userId}` TTL 5 min
- Active avatar: `avatar:{userId}:active` TTL 5 min
- Generation status: `avatar:{id}:generation` TTL until completion

---

## CalendarService

**File:** `src/calendar/calendar.service.ts`

### Dependencies
- `PrismaService` - Database access
- `OutfitService` - Outfit validation
- `RecommendationEngine` - Auto-suggest outfits
- `NotificationService` - Daily reminders
- `Redis` - Calendar cache

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `schedule` | `userId: string, dto: ScheduleOutfitDto` | `Promise<CalendarEntry>` | Schedule outfit on date |
| `update` | `id: string, userId: string, dto: UpdateCalendarDto` | `Promise<CalendarEntry>` | Change outfit/date/notes |
| `unschedule` | `id: string, userId: string` | `Promise<void>` | Remove calendar entry |
| `getByDate` | `userId: string, date: string` | `Promise<CalendarEntry | null>` | Get entry for specific date |
| `getRange` | `userId: string, startDate: string, endDate: string` | `Promise<CalendarEntry[]>` | Get entries in range |
| `getRangeSummary` | `userId: string, startDate: string, endDate: string` | `Promise<CalendarSummary>` | Aggregate statistics |
| `fillWeek` | `userId: string, startDate: string` | `Promise<CalendarEntry[]>` | Auto-fill week with recommendations |
| `getMissingDays` | `userId: string, startDate: string, endDate: string` | `Promise<string[]>` | Days without outfit scheduled |
| `createRecurring` | `userId: string, dto: RecurringScheduleDto` | `Promise<CalendarEntry[]>` | Create recurring schedule |
| `processReminders` | (none, cron) | `Promise<void>` | Send push notifications for today's outfits |

### Private Methods

| Method | Description |
|--------|-------------|
| `validateDateNotPast` | Reject scheduling in past |
| `validateNoOverlap` | One entry per day |
| `expandRecurringDates` | Generate date list from pattern |
| `getSuggestedOutfit` | AI-select best outfit for day |

### Error Handling
- `NotFoundException` - Entry/outfit not found
- `ForbiddenException` - Not owner
- `BadRequestException` - Past date, duplicate date
- `ConflictException` - Date already has entry

### Caching Strategy
- Date range: `calendar:{userId}:{startDate}:{endDate}` TTL 5 min
- Single date: `calendar:{userId}:{date}` TTL 5 min
- Invalidated on schedule, update, unschedule

---

## NotificationService

**File:** `src/notification/notification.service.ts`

### Dependencies
- `PrismaService` - Database access
- `FcmService` - Firebase Cloud Messaging
- `EventsGateway` - WebSocket push
- `MailService` - Email notifications
- `Redis` - Notification deduplication

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `userId: string, dto: CreateNotificationDto` | `Promise<Notification>` | Create and deliver |
| `findAll` | `userId: string, filters: NotificationFilters` | `Promise<PaginatedResult<Notification>>` | Paginated list |
| `markAsRead` | `id: string, userId: string` | `Promise<void>` | Mark single read |
| `markAllAsRead` | `userId: string` | `Promise<void>` | Mark all read |
| `getUnreadCount` | `userId: string` | `Promise<number>` | Count unread |
| `getSettings` | `userId: string` | `Promise<NotificationSettings>` | Get notification prefs |
| `updateSettings` | `userId: string, dto: UpdateNotificationSettingsDto` | `Promise<NotificationSettings>` | Update prefs |
| `registerFcmToken` | `userId: string, dto: RegisterFcmTokenDto` | `Promise<void>` | Register device |
| `unregisterFcmToken` | `userId: string, token: string` | `Promise<void>` | Remove device |
| `deliverToUser` | `userId: string, notification: Notification` | `Promise<void>` | Route to channels |
| `processDailyReminders` | (none, cron) | `Promise<void>` | Send scheduled reminders |

### Private Methods

| Method | Description |
|--------|-------------|
| `shouldDeliverViaPush` | Check user push prefs |
| `shouldDeliverViaEmail` | Check user email prefs |
| `shouldDeliverViaInApp` | Check user in-app prefs |
| `sendPushNotification` | Send via FCM |
| `sendEmailNotification` | Send via MailService |
| `sendWebSocketNotification` | Send via EventsGateway |
| `deduplicate` | Check Redis for duplicate within 5 min |

### Error Handling
- `NotFoundException` - Notification/settings not found
- `ForbiddenException` - Not owner
- Silently log FCM failures (non-critical)

### Caching Strategy
- Unread count: `notifications:{userId}:unread` TTL 1 min
- Settings: `notifications:{userId}:settings` TTL 5 min
- Invalidated on create, read, settings update

---

## AnalyticsService

**File:** `src/analytics/analytics.service.ts`

### Dependencies
- `PrismaService` - Database access
- `Redis` - Aggregated data cache
- `EventEmitter2` - Track events

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getGarmentAnalytics` | `userId: string, query: AnalyticsQuery` | `Promise<GarmentAnalyticsData>` | Garment stats |
| `getAiPrecision` | `userId: string` | `Promise<AiPrecisionData>` | AI model metrics |
| `getUsageAnalytics` | `userId: string, query: AnalyticsQuery` | `Promise<UsageAnalyticsData>` | Usage stats |
| `getDashboard` | `userId: string, period?: string` | `Promise<DashboardData>` | Combined dashboard |
| `trackEvent` | `userId: string, eventName: string, eventData?: any` | `Promise<void>` | Record analytics event |
| `getUserStreak` | `userId: string` | `Promise<StreakData>` | Active day streak |
| `getFeatureUsage` | `userId: string` | `Promise<FeatureUsage[]>` | Feature frequency |
| `getModelMetrics` | `modelName: string, modelVersion: string` | `Promise<ModelMetrics[]>` | AI performance metrics |

### Private Methods

| Method | Description |
|--------|-------------|
| `aggregateGarmentsByCategory` | SQL GROUP BY category |
| `aggregateGarmentsByColor` | SQL GROUP BY color |
| `aggregateGarmentsByState` | SQL GROUP BY state |
| `calculateProcessingSuccess` | Percentage of completed vs failed |
| `calculateAverageProcessingTime` | Average duration |
| `computeTrend` | Compare current vs previous period |
| `generateInsights` | Rule-based tip generation |

### Error Handling
- `BadRequestException` - Invalid date range
- All analytics are computed or fetched from cache; never throws for missing data

### Caching Strategy
- Dashboard: `analytics:{userId}:dashboard:{period}` TTL 5 min
- Garment analytics: `analytics:{userId}:garments:{dateRange}` TTL 10 min
- AI precision: `analytics:{userId}:ai-precision` TTL 1 hour
- Usage analytics: `analytics:{userId}:usage:{dateRange}` TTL 10 min
- Invalidated on nightly aggregation or manual refresh

---

## StorageService

**File:** `src/storage/storage.service.ts`

### Dependencies
- `Cloudinary` client - Image/video cloud storage
- `GoogleDrive` client - Backup storage
- `Sharp` - Image processing (compression, thumbnail)
- `ConfigService` - Bucket names, encryption keys
- `PrismaService` - File metadata tracking
- `Redis` - Signed URL cache

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `generateUploadUrl` | `userId: string, dto: UploadUrlDto` | `Promise<SignedUrlResult>` | Presigned upload URL |
| `generateSignedUrl` | `userId: string, fileId: string, expiresIn?: number` | `Promise<SignedUrlResult>` | Read URL |
| `uploadFile` | `userId: string, file: Buffer, options: UploadOptions` | `Promise<StorageFile>` | Direct server upload |
| `uploadFromUrl` | `userId: string, url: string, options: UploadOptions` | `Promise<StorageFile>` | Upload from URL |
| `deleteFile` | `fileId: string, userId: string, permanent?: boolean` | `Promise<void>` | Delete/move to trash |
| `getFile` | `fileId: string, userId: string` | `Promise<StorageFile>` | Get file metadata |
| `listFiles` | `userId: string, folder?: string` | `Promise<StorageFile[]>` | List files |
| `optimizeImage` | `inputPath: string, options: OptimizeOptions` | `Promise<Buffer>` | Compress + resize |
| `generateThumbnail` | `inputPath: string, width: number, height: number` | `Promise<Buffer>` | Create thumbnail |
| `validateFile` | `file: Buffer, mimeType: string, size: number` | `Promise<ValidationResult>` | Validate against rules |
| `calculateChecksum` | `file: Buffer` | `Promise<string>` | SHA-256 hash |
| `backupFile` | `fileId: string` | `Promise<void>` | Copy to Google Drive |
| `cleanupTrash` | (none, cron) | `Promise<void>` | Permanently delete trash older than 30 days |

### Private Methods

| Method | Description |
|--------|-------------|
| `getCloudinaryInstance` | Configured Cloudinary SDK |
| `getGoogleDriveInstance` | Configured Google Drive client |
| `encryptFile` | AES-256-CBC encryption |
| `decryptFile` | AES-256-CBC decryption |
| `getStorageFolder` | Build folder path: `users/{userId}/{resourceType}/` |
| `compressImage` | Sharp pipeline for optimization |
| `createThumbnail` | Sharp pipeline for thumbnail |

### Error Handling
- `BadRequestException` - Invalid file type/size
- `NotFoundException` - File not found
- `ForbiddenException` - Not owner
- `PayloadTooLargeException` - Exceeds limits
- `ServiceUnavailableException` - Cloudinary/Drive unavailable

### Caching Strategy
- Signed URLs: `storage:signed:{fileId}` TTL matches URL expiry
- File metadata: `storage:file:{fileId}` TTL 5 min

---

## SyncService

**File:** `src/sync/sync.service.ts`

### Dependencies
- `PrismaService` - Database access
- `Redis` - Conflict tracking, offline queue
- `EventsGateway` - Real-time sync events

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `submitChanges` | `userId: string, changes: SyncChange[]` | `Promise<SyncResult>` | Process offline changes |
| `resolveConflict` | `userId: string, dto: ResolveConflictDto` | `Promise<SyncResult>` | Resolve specific conflict |
| `getPendingChanges` | `userId: string` | `Promise<SyncChange[]>` | Get pending |
| `getSyncStatus` | `userId: string` | `Promise<SyncStatus>` | Overall sync health |
| `processChange` | `change: SyncChange` | `Promise<void>` | Apply single change |
| `detectConflict` | `change: SyncChange, current: any` | `Promise<boolean>` | Check for conflict |
| `mergeChanges` | `server: any, client: any, strategy: string` | `Promise<any>` | Merge based on strategy |

### Private Methods

| Method | Description |
|--------|-------------|
| `applyCreate` | INSERT with conflict check |
| `applyUpdate` | UPDATE with optimistic locking |
| `applyDelete` | Soft delete |
| `generateChecksum` | Hash entity state |
| `compareChecksums` | Determine if conflict exists |
| `storeOfflineChange` | Cache pending change in Redis |

### Error Handling
- `ConflictException` - Sync conflict detected
- `BadRequestException` - Invalid change payload
- All conflicts resolved via user interaction or automatic merge rules

### Caching Strategy
- Pending changes: `sync:{userId}:pending` TTL until synced
- Conflict list: `sync:{userId}:conflicts` TTL until resolved

---

## SearchService

**File:** `src/search/search.service.ts`

### Dependencies
- `PrismaService` - Full-text search queries
- `Redis` - Search result cache

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `searchGarments` | `userId: string, query: string, filters: SearchFilters` | `Promise<PaginatedResult<Garment>>` | Full-text garment search |
| `searchOutfits` | `userId: string, query: string, filters: SearchFilters` | `Promise<PaginatedResult<Outfit>>` | Full-text outfit search |
| `globalSearch` | `userId: string, query: string` | `Promise<GlobalSearchResult>` | Search all entities |
| `suggestTags` | `userId: string, prefix: string` | `Promise<string[]>` | Auto-complete tags |
| `suggestBrands` | `userId: string, prefix: string` | `Promise<string[]>` | Auto-complete brands |

### Private Methods

| Method | Description |
|--------|-------------|
| `buildSearchQuery` | Construct tsquery from search terms |
| `rankResults` | Order by relevance (ts_rank) |
| `applyFilters` | Add category, color, state WHERE clauses |

### Caching Strategy
- Search results: `search:{userId}:{queryHash}:{filtersHash}` TTL 2 min
- Suggestions: `search:suggestions:{userId}:{type}:{prefix}` TTL 1 hour

---

## ExportService

**File:** `src/export/export.service.ts`

### Dependencies
- `PrismaService` - Data access
- `StorageService` - File storage
- `Redis` - Job status tracking

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `requestExport` | `userId: string, dto: ExportRequestDto` | `Promise<ExportJob>` | Create export job |
| `getStatus` | `id: string, userId: string` | `Promise<ExportJob>` | Get job status |
| `processExport` | `jobId: string` | `Promise<void>` | Generate export file |
| `getDownloadUrl` | `id: string, userId: string` | `Promise<string>` | Signed download URL |
| `cleanupExpired` | (none, cron) | `Promise<void>` | Delete expired exports |

### Private Methods

| Method | Description |
|--------|-------------|
| `collectGarments` | Query user's garments |
| `collectOutfits` | Query user's outfits |
| `collectAvatars` | Query user's avatars |
| `collectCalendar` | Query calendar entries |
| `collectAnalytics` | Query analytics data |
| `collectSettings` | Query preferences and settings |
| `serializeJson` | Convert to JSON |
| `serializeCsv` | Convert to CSV |
| `compressExport` | Gzip compression |

### Error Handling
- `NotFoundException` - Job not found
- `ForbiddenException` - Not owner
- `BadRequestException` - Invalid format
- `TooManyRequestsException` - Once per 24h limit

### Caching Strategy
- Job status: `export:{id}` TTL until completion + 1 hour

---

## AiPipelineService

**File:** `src/ai/ai-pipeline.service.ts`

### Dependencies
- `Bull` / `BullMQ` - Job queue
- `Redis` - Queue state
- `HttpService` - Python AI service API
- `StorageService` - Image storage
- `PrismaService` - Result persistence
- `EventEmitter2` - Pipeline events
- `ConfigService` - Model URLs, thresholds

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `processGarmentImage` | `garmentId: string, imageUrl: string` | `Promise<void>` | Queue full pipeline |
| `processAvatarVideo` | `avatarId: string, videoUrl: string` | `Promise<void>` | Queue avatar gen |
| `generateRecommendations` | `userId: string, context: RecommendationContext` | `Promise<RecommendationResult>` | Get recommendations |
| `getPipelineStatus` | `garmentId: string` | `Promise<PipelineStatus>` | Current step/progress |
| `cancelProcessing` | `garmentId: string` | `Promise<void>` | Cancel active job |
| `retryFailed` | `garmentId: string` | `Promise<void>` | Retry from last step |

### Private Methods

| Method | Description |
|--------|-------------|
| `queueJob` | Push to Bull queue with retry config |
| `executeStep` | Call Python service for specific step |
| `handleStepCompletion` | Update DB progress, emit event |
| `handleStepFailure` | Log error, set failed status, notify user |
| `executeDetection` | Call Detectron2 service |
| `executeBackgroundRemoval` | Call OpenCV service |
| `executeColorDetection` | Call k-means service |
| `executeClassification` | Call Hugging Face service |
| `executeCompression` | Run Sharp/FFmpeg |
| `executeThumbnailGeneration` | Run Sharp |
| `executeEmbeddingGeneration` | Call embedding service |

### Queue Configuration

```typescript
const garmentPipelineQueue = new Queue('garment-pipeline', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});
```

### Error Handling
- Each step has independent try/catch
- Failed steps are retried up to 3 times with exponential backoff
- After all retries exhausted, garment marked as `failed` with error message
- User notified via notification service

### Caching Strategy
- Pipeline status: `pipeline:{garmentId}` TTL until completion
- Locks prevent concurrent processing of same garment

---

## RenderService

**File:** `src/render/render.service.ts`

### Dependencies
- `HttpService` - 3D rendering API calls
- `StorageService` - Model storage
- `Bull` - Render job queue
- `ConfigService` - Render engine config

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `generateOutfitPreview` | `outfitId: string, avatarId: string` | `Promise<void>` | Queue render job |
| `getRenderStatus` | `jobId: string` | `Promise<RenderStatus>` | Check progress |
| `optimizeModel` | `modelUrl: string, options: OptimizeOptions` | `Promise<string>` | Compress 3D model |
| `generateThumbnail` | `modelUrl: string` | `Promise<string>` | 2D thumbnail from 3D |
| `applyGarmentToAvatar` | `avatarModelUrl: string, garmentImageUrl: string, position: string` | `Promise<string>` | Drape garment |

### Private Methods

| Method | Description |
|--------|-------------|
| `loadAvatarModel` | Fetch GLTF from storage |
| `loadGarmentTexture` | Fetch garment image |
| `compositeScene` | Merge avatar + garment |
| `renderScene` | Call rendering engine |
| `saveResult` | Upload rendered image to storage |

### Error Handling
- `NotFoundException` - Avatar or outfit not found
- `ServiceUnavailableException` - Render engine down
- Failed renders retried up to 2 times

### Caching Strategy
- Render results stored permanently in Cloudinary
- Job status cached in Redis TTL 1 hour
