import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { IntelligenceService } from './intelligence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, IntelligenceService],
  exports: [AnalyticsService, IntelligenceService],
})
export class AnalyticsModule {}
