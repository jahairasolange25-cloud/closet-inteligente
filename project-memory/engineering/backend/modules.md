# NestJS Module Structure

## Module Dependency Graph

```
                      ┌─────────────────────┐
                      │     AppModule        │
                      │  (root module)       │
                      └────────┬────────────┘
                               │
               ┌───────────────┼───────────────────┐
               │                                  │
               v                                  v
     ┌─────────────────────┐         ┌─────────────────────┐
     │   CoreModule        │         │   SharedModule      │
     │  (global providers) │───────▶│  (shared utilities)  │
     └─────────────────────┘         └─────────────────────┘
               │                                  │
               v                                  v
     ┌─────────────────────┐         ┌─────────────────────┐
     │   AuthModule         │         │   DatabaseModule    │
     └─────────────────────┘         └─────────────────────┘
               │
               v
     ┌─────────────────────┐         ┌─────────────────────┐
     │   UserModule         │         │   GarmentModule     │
     └─────────────────────┘         └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   OutfitModule       │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   AvatarModule       │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   CalendarModule     │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │ NotificationModule   │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   AnalyticsModule    │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   StorageModule      │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   ExportModule       │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │    SyncModule        │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │    AiModule          │
                                     │ (AI pipeline client) │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   RenderModule       │
                                     └─────────────────────┘
                                               │
                                               v
                                     ┌─────────────────────┐
                                     │   GatewayModule      │
                                     │ (WebSocket gateway)  │
                                     └─────────────────────┘
```

---

## 1. AppModule

**File:** `src/app.module.ts`

```typescript
@Module({
  imports: [
    CoreModule,
    SharedModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    GarmentModule,
    OutfitModule,
    AvatarModule,
    CalendarModule,
    NotificationModule,
    AnalyticsModule,
    StorageModule,
    ExportModule,
    SyncModule,
    AiModule,
    RenderModule,
    GatewayModule,
    RouterModule.register([{
      path: 'v1',
      module: V1Module,
      children: [
        { path: 'auth', module: AuthModule },
        { path: 'users', module: UserModule },
        { path: 'garments', module: GarmentModule },
        { path: 'outfits', module: OutfitModule },
        { path: 'avatars', module: AvatarModule },
        { path: 'calendar', module: CalendarModule },
        { path: 'notifications', module: NotificationModule },
        { path: 'analytics', module: AnalyticsModule },
        { path: 'storage', module: StorageModule },
        { path: 'export', module: ExportModule },
        { path: 'sync', module: SyncModule },
      ],
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/*', '/ws*'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
  ],
  controllers: [HealthController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 2. CoreModule

**File:** `src/core/core.module.ts`

**Purpose:** Global providers registered once at app root.

```typescript
@Global()
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: GlobalValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: WebSocketExceptionFilter,
    },
  ],
  exports: [],
})
export class CoreModule {}
```

---

## 3. SharedModule

**File:** `src/shared/shared.module.ts`

```typescript
@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        timeout: 10000,
        maxRedirects: 3,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PrismaService,
    RedisService,
    EventEmitterService,
    LoggerService,
    MailService,
    FcmService,
    EncryptionService,
    SlugService,
    DateUtils,
  ],
  exports: [
    HttpModule,
    PrismaService,
    RedisService,
    EventEmitterService,
    LoggerService,
    MailService,
    FcmService,
    EncryptionService,
    SlugService,
    DateUtils,
  ],
})
export class SharedModule {}
```

---

## 4. DatabaseModule

**File:** `src/database/database.module.ts`

```typescript
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (config: ConfigService) => {
        return new PrismaService({
          datasources: {
            db: {
              url: config.get('DATABASE_URL'),
            },
          },
          log: config.get('NODE_ENV') === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

---

## 5. AuthModule

**File:** `src/auth/auth.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: '15m',
          algorithm: 'RS256',
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

**Controllers:** `AuthController`

**Routes:**
- `POST /auth/register` (public)
- `POST /auth/login` (public)
- `POST /auth/refresh` (public)
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me`
- `POST /auth/forgot-password` (public)
- `POST /auth/reset-password` (public)
- `POST /auth/verify-email` (public)

**Exports to:** UserModule (for auth), all modules needing JWT verification

---

## 6. UserModule

**File:** `src/user/user.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserPreferencesService],
  exports: [UserService],
})
export class UserModule {}
```

**Controllers:** `UserController`

**Routes:**
- `GET /users/:id` (admin only)
- `PATCH /users/:id` (admin only)
- `DELETE /users/:id` (admin only)

**Exports to:** AuthModule (user creation), GarmentModule, OutfitModule, AvatarModule

---

## 7. GarmentModule

**File:** `src/garment/garment.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => StorageModule),
    forwardRef(() => AiModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => SearchModule),
  ],
  controllers: [GarmentController],
  providers: [
    GarmentService,
    GarmentImageService,
    GarmentProcessingService,
  ],
  exports: [GarmentService],
})
export class GarmentModule {}
```

**Controllers:** `GarmentController`

**Routes:**
- `POST /garments`
- `GET /garments`
- `GET /garments/search`
- `GET /garments/:id`
- `PATCH /garments/:id`
- `DELETE /garments/:id`
- `POST /garments/:id/upload`
- `GET /garments/:id/status`

**Exports to:** OutfitModule, AnalyticsModule, ExportModule

---

## 8. OutfitModule

**File:** `src/outfit/outfit.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => GarmentModule),
    forwardRef(() => AiModule),
    forwardRef(() => RenderModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => StorageModule),
  ],
  controllers: [OutfitController],
  providers: [
    OutfitService,
    RecommendationEngine,
    OutfitPreviewService,
  ],
  exports: [OutfitService, RecommendationEngine],
})
export class OutfitModule {}
```

**Controllers:** `OutfitController`

**Routes:**
- `POST /outfits`
- `GET /outfits`
- `GET /outfits/daily`
- `POST /outfits/recommend`
- `GET /outfits/:id`
- `PATCH /outfits/:id`
- `DELETE /outfits/:id`
- `POST /outfits/:id/generate`

**Exports to:** CalendarModule, AnalyticsModule, ExportModule

---

## 9. AvatarModule

**File:** `src/avatar/avatar.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => StorageModule),
    forwardRef(() => AiModule),
    forwardRef(() => RenderModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [AvatarController],
  providers: [
    AvatarService,
    AvatarVersionService,
    BodyMeasurementService,
  ],
  exports: [AvatarService],
})
export class AvatarModule {}
```

**Controllers:** `AvatarController`

**Routes:**
- `POST /avatars`
- `GET /avatars/:id`
- `PATCH /avatars/:id`
- `DELETE /avatars/:id`
- `POST /avatars/:id/generate`

**Exports to:** RenderModule, ExportModule

---

## 10. CalendarModule

**File:** `src/calendar/calendar.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => OutfitModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    RecurringScheduleService,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
```

**Controllers:** `CalendarController`

**Routes:**
- `GET /calendar`
- `GET /calendar/range`
- `PATCH /calendar/:id`
- `DELETE /calendar/:id`
- `POST /calendar/fill`

**Exports to:** AnalyticsModule, NotificationModule, ExportModule

---

## 11. NotificationModule

**File:** `src/notification/notification.module.ts`

```typescript
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PushNotificationService,
    EmailNotificationService,
    InAppNotificationService,
    NotificationScheduler,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
```

**Controllers:** `NotificationController`

**Routes:**
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `GET /notifications/settings`
- `PATCH /notifications/settings`
- `POST /notifications/fcm/register`
- `DELETE /notifications/fcm/:token`

**Exports to:** All modules (used for sending notifications)

---

## 12. AnalyticsModule

**File:** `src/analytics/analytics.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => GarmentModule),
    forwardRef(() => OutfitModule),
    forwardRef(() => CalendarModule),
    BullModule.registerQueue({
      name: 'analytics-aggregation',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    GarmentAnalyticsAggregator,
    UsageAnalyticsAggregator,
    AiPrecisionService,
    DashboardService,
    StreakService,
    InsightsGenerator,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
```

**Controllers:** `AnalyticsController`

**Routes:**
- `GET /analytics/garments`
- `GET /analytics/ai-precision`
- `GET /analytics/usage`
- `GET /analytics/dashboard`
- `POST /analytics/track`

**Exports to:** ExportModule

---

## 13. StorageModule

**File:** `src/storage/storage.module.ts`

```typescript
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-processing',
    }),
    BullModule.registerQueue({
      name: 'backup',
    }),
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    CloudinaryProvider,
    GoogleDriveProvider,
    ImageOptimizer,
    ThumbnailGenerator,
    BackupService,
  ],
  exports: [StorageService, CloudinaryProvider, ImageOptimizer],
})
export class StorageModule {}
```

**Controllers:** `StorageController`

**Routes:**
- `POST /storage/upload`
- `GET /storage/signed-url`
- `DELETE /storage/delete`
- `GET /storage/files`

**Exports to:** GarmentModule, AvatarModule, RenderModule

---

## 14. ExportModule

**File:** `src/export/export.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => GarmentModule),
    forwardRef(() => OutfitModule),
    forwardRef(() => AvatarModule),
    forwardRef(() => CalendarModule),
    forwardRef(() => AnalyticsModule),
    forwardRef(() => StorageModule),
    BullModule.registerQueue({
      name: 'exports',
    }),
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    JsonSerializer,
    CsvSerializer,
    ExportCompressor,
  ],
  exports: [ExportService],
})
export class ExportModule {}
```

**Controllers:** `ExportController`

**Routes:**
- `POST /export/data`
- `GET /export/:id/status`

---

## 15. SyncModule

**File:** `src/sync/sync.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => GarmentModule),
    forwardRef(() => OutfitModule),
    forwardRef(() => AvatarModule),
    forwardRef(() => CalendarModule),
    forwardRef(() => GatewayModule),
  ],
  controllers: [SyncController],
  providers: [
    SyncService,
    ConflictResolver,
    OfflineQueueService,
    ChecksumService,
  ],
  exports: [SyncService],
})
export class SyncModule {}
```

**Controllers:** `SyncController`

**Routes:**
- `POST /sync/submit`
- `POST /sync/resolve`
- `GET /sync/pending`
- `GET /sync/status`

---

## 16. AiModule

**File:** `src/ai/ai.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => GarmentModule),
    forwardRef(() => AvatarModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => StorageModule),
    HttpModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        baseURL: config.get('AI_SERVICE_URL'),
        timeout: 300000, // 5 min for AI processing
        maxRedirects: 0,
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'garment-pipeline',
    }),
    BullModule.registerQueue({
      name: 'avatar-generation',
    }),
    BullModule.registerQueue({
      name: 'recommendations',
    }),
  ],
  providers: [
    AiPipelineService,
    GarmentDetectionClient,
    ColorDetectionClient,
    ClassificationClient,
    EmbeddingClient,
    AvatarGenerationClient,
    RecommendationClient,
    PipelineOrchestrator,
  ],
  exports: [
    AiPipelineService,
    RecommendationClient,
  ],
})
export class AiModule {}
```

**No controllers** (internal service-to-service communication via HTTP + BullMQ)

**Exports to:** GarmentModule, AvatarModule, OutfitModule

---

## 17. RenderModule

**File:** `src/render/render.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => StorageModule),
    forwardRef(() => AvatarModule),
    forwardRef(() => GarmentModule),
    BullModule.registerQueue({
      name: 'rendering',
    }),
  ],
  providers: [
    RenderService,
    ThreeJsRenderer,
    ModelOptimizer,
    TextureBaker,
    RenderQueueService,
  ],
  exports: [RenderService],
})
export class RenderModule {}
```

**No controllers** (internal service, triggered via events/queue)

**Exports to:** OutfitModule, AvatarModule, GatewayModule

---

## 18. GatewayModule

**File:** `src/gateway/gateway.module.ts`

```typescript
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => SyncModule),
    forwardRef(() => GarmentModule),
    forwardRef(() => OutfitModule),
    forwardRef(() => AvatarModule),
    forwardRef(() => CalendarModule),
  ],
  providers: [
    EventsGateway,
    ConnectionManager,
    RoomManager,
    WebSocketAuthMiddleware,
    RedisAdapter,
  ],
  exports: [EventsGateway],
})
export class GatewayModule {}
```

**No controllers** (WebSocket-only module)

**Exports to:** SyncModule (for broadcasting sync events), NotificationModule (for push notifications)

---

## Module Dependency Rules

1. **No circular dependencies** are allowed; use `forwardRef()` where needed.
2. **CoreModule** is `@Global()` — all guards, interceptors, pipes, filters.
3. **SharedModule** exports `PrismaService`, `RedisService`, and utilities to all modules.
4. **DatabaseModule** is separate to allow future database abstraction or multi-tenant config.
5. **AiModule** and **RenderModule** are internal — they expose services but no HTTP routes.
6. Every module that needs notifications must import `NotificationModule`.
7. Every module that needs file uploads must import `StorageModule`.

---

## Provider Registration Summary

| Module | Controllers | Providers | Exports |
|--------|-------------|-----------|---------|
| AppModule | HealthController | AppService | — |
| CoreModule | — | 8 global providers | — |
| SharedModule | — | 8 utilities | 8 providers |
| DatabaseModule | — | PrismaService | PrismaService |
| AuthModule | AuthController | 4 providers | 2 providers |
| UserModule | UserController | 2 providers | UserService |
| GarmentModule | GarmentController | 3 providers | GarmentService |
| OutfitModule | OutfitController | 3 providers | 2 providers |
| AvatarModule | AvatarController | 3 providers | AvatarService |
| CalendarModule | CalendarController | 2 providers | CalendarService |
| NotificationModule | NotificationController | 5 providers | NotificationService |
| AnalyticsModule | AnalyticsController | 7 providers | AnalyticsService |
| StorageModule | StorageController | 5 providers | 3 providers |
| ExportModule | ExportController | 4 providers | ExportService |
| SyncModule | SyncController | 4 providers | SyncService |
| AiModule | — | 8 providers | 2 providers |
| RenderModule | — | 5 providers | RenderService |
| GatewayModule | — | 5 providers | EventsGateway |
