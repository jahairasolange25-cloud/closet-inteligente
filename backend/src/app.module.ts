import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { HealthController } from './health/health.controller';
import { AnalyticsModule } from './analytics/analytics.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AvatarsModule } from './avatars/avatars.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ConsentModule } from './consent/consent.module';
import { ExportModule } from './export/export.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CalendarModule } from './calendar/calendar.module';
import { GarmentsModule } from './garments/garments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { OutfitsModule } from './outfits/outfits.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createValidationPipe } from './common/pipes/global-validation.pipe';
import { DatabaseMonitor } from './database/database.monitor';
import { RequestTimeoutGuard } from './common/guards/request-timeout.guard';
import { CsrfGuard } from './common/guards/csrf.guard';

@Module({
  controllers: [HealthController],
  imports: [
    DatabaseModule,
    RedisModule,
    SupabaseModule,
    AnalyticsModule,
    AuthModule,
    AvatarsModule,
    CalendarModule,
    ConsentModule,
    ExportModule,
    WebSocketModule,
    GarmentsModule,
    NotificationsModule,
    OutfitsModule,
    PipelineModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RequestTimeoutGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () => createValidationPipe(),
    },
    DatabaseMonitor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
