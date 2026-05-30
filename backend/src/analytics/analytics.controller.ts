import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { IntelligenceService } from './intelligence.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryUsageAnalyticsDto } from './dto/query-usage-analytics.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly intelligenceService: IntelligenceService,
  ) {}

  @Get('garments')
  @HttpCode(HttpStatus.OK)
  async getGarmentAnalytics(@CurrentUser('id') userId: string) {
    return this.analyticsService.getGarmentAnalytics(userId);
  }

  @Get('usage')
  @HttpCode(HttpStatus.OK)
  async getUsageAnalytics(
    @CurrentUser('id') userId: string,
    @Query() query: QueryUsageAnalyticsDto,
  ) {
    return this.analyticsService.getUsageAnalytics(userId, query);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(
    @CurrentUser('id') userId: string,
    @Query() query: QueryDashboardDto,
  ) {
    return this.analyticsService.getDashboardAnalytics(userId, query);
  }

  @Get('ai-precision')
  @HttpCode(HttpStatus.OK)
  async getAIPrecision(@CurrentUser('id') userId: string) {
    return this.analyticsService.getAIPrecisionAnalytics(userId);
  }

  @Get('insights')
  @HttpCode(HttpStatus.OK)
  async getWardrobeInsights(@CurrentUser('id') userId: string) {
    return this.intelligenceService.getWardrobeInsights(userId);
  }

  @Get('trends')
  @HttpCode(HttpStatus.OK)
  async getTrends(@CurrentUser('id') userId: string) {
    return this.intelligenceService.getTrendDetection(userId);
  }

  @Get('funnels')
  @HttpCode(HttpStatus.OK)
  async getEngagementFunnels(@CurrentUser('id') userId: string) {
    return this.intelligenceService.getEngagementFunnels(userId);
  }

  @Post('retention')
  @HttpCode(HttpStatus.OK)
  async getRetentionMetrics() {
    return this.intelligenceService.getRetentionMetrics();
  }

  @Get('uploads')
  @HttpCode(HttpStatus.OK)
  async getUploadAnalytics() {
    return this.intelligenceService.getUploadCompletionAnalytics();
  }

  @Get('ai-corrections')
  @HttpCode(HttpStatus.OK)
  async getAICorrectionAnalytics() {
    return this.intelligenceService.getAICorrectionAnalytics();
  }
}
