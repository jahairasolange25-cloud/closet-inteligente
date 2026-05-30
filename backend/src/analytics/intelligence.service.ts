import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class IntelligenceService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async getWardrobeInsights(userId: string): Promise<any> {
    const [
      garmentStats,
      usageStats,
      colorStats,
      styleStats,
      seasonStats,
      favoriteCombos,
    ] = await Promise.all([
      this.getGarmentStats(userId),
      this.getUsageStats(userId),
      this.getColorDistribution(userId),
      this.getStyleDistribution(userId),
      this.getSeasonDistribution(userId),
      this.getFavoriteCombinations(userId),
    ]);

    const insights = this.generateInsights(
      garmentStats,
      usageStats,
      colorStats,
      styleStats,
      seasonStats,
    );

    return {
      garment_stats: garmentStats,
      usage_stats: usageStats,
      color_distribution: colorStats,
      style_distribution: styleStats,
      season_distribution: seasonStats,
      favorite_combinations: favoriteCombos,
      insights,
    };
  }

  private async getGarmentStats(userId: string): Promise<any> {
    const totalResult = await this.pool.query(
      `SELECT COUNT(*)::int AS total,
              SUM(usage_count)::int AS total_wears,
              AVG(usage_count)::float AS avg_wears,
              COUNT(*) FILTER (WHERE usage_count = 0)::int AS never_worn,
              COUNT(*) FILTER (WHERE usage_count > 20)::int AS overused
       FROM garments
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    return totalResult.rows[0] || {};
  }

  private async getUsageStats(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         COALESCE(AVG(cost_per_wear), 0)::float AS avg_cost_per_wear,
         COUNT(*) FILTER (WHERE days_since_worn > 90)::int AS unused_90d,
         COUNT(*) FILTER (WHERE days_since_worn > 180)::int AS unused_180d
       FROM (
         SELECT
           usage_count,
           CASE WHEN usage_count > 0
             THEN EXTRACT(DAY FROM NOW() - last_used_at)
             ELSE 365
           END AS days_since_worn,
           CASE WHEN usage_count > 0
             THEN 0
             ELSE 0
           END AS cost_per_wear
         FROM garments
         WHERE user_id = $1 AND deleted_at IS NULL
       ) sub`,
      [userId],
    );
    return result.rows[0] || {};
  }

  private async getColorDistribution(userId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT unnest(dominant_colors_hex) AS color, COUNT(*)::int AS count
       FROM garments
       WHERE user_id = $1 AND deleted_at IS NULL
         AND array_length(dominant_colors_hex, 1) > 0
       GROUP BY color
       ORDER BY count DESC
       LIMIT 15`,
      [userId],
    );
    return result.rows;
  }

  private async getStyleDistribution(userId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT unnest(style_tags) AS style, COUNT(*)::int AS count
       FROM garments
       WHERE user_id = $1 AND deleted_at IS NULL
         AND array_length(style_tags, 1) > 0
       GROUP BY style
       ORDER BY count DESC`,
      [userId],
    );
    return result.rows;
  }

  private async getSeasonDistribution(userId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT unnest(season_tags) AS season, COUNT(*)::int AS count
       FROM garments
       WHERE user_id = $1 AND deleted_at IS NULL
         AND array_length(season_tags, 1) > 0
       GROUP BY season
       ORDER BY count DESC`,
      [userId],
    );
    return result.rows;
  }

  private async getFavoriteCombinations(userId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT
         og.outfit_id,
         o.name AS outfit_name,
         COUNT(DISTINCT og.garment_id) AS garment_count,
         COUNT(owh.id) AS times_worn
       FROM outfit_garments og
       JOIN outfits o ON o.id = og.outfit_id AND o.deleted_at IS NULL
       LEFT JOIN outfit_wear_history owh ON owh.outfit_id = o.id
       WHERE o.user_id = $1
       GROUP BY og.outfit_id, o.name
       HAVING COUNT(owh.id) > 0
       ORDER BY times_worn DESC
       LIMIT 10`,
      [userId],
    );
    return result.rows;
  }

  private generateInsights(
    garmentStats: any,
    usageStats: any,
    colorStats: any[],
    styleStats: any[],
    seasonStats: any[],
  ): any[] {
    const insights: any[] = [];

    if (garmentStats.never_worn > 0) {
      insights.push({
        type: 'opportunity',
        severity: garmentStats.never_worn > 10 ? 'high' : 'medium',
        title: `${garmentStats.never_worn} garments never worn`,
        description: 'Consider creating outfits with these unused pieces or donating them.',
        metric: garmentStats.never_worn,
        action: 'view_unused',
      });
    }

    if (garmentStats.overused > 0) {
      insights.push({
        type: 'warning',
        severity: garmentStats.overused > 5 ? 'high' : 'low',
        title: `${garmentStats.overused} garments overused`,
        description: 'Some garments have been worn many times. Rotate with lesser-used items.',
        metric: garmentStats.overused,
        action: 'view_overused',
      });
    }

    if (colorStats.length > 0) {
      const topColor = colorStats[0];
      const totalInTop = colorStats
        .slice(0, 3)
        .reduce((sum: number, c: any) => sum + c.count, 0);
      const totalAll = colorStats.reduce((sum: number, c: any) => sum + c.count, 0);

      if (totalInTop / totalAll > 0.6) {
        insights.push({
          type: 'suggestion',
          severity: 'medium',
          title: 'Color palette imbalance detected',
          description: `${topColor.color} dominates your wardrobe. Consider adding complementary colors for more variety.`,
          metric: Math.round((totalInTop / totalAll) * 100),
          action: 'view_colors',
        });
      }
    }

    if (seasonStats.length > 0) {
      const currentSeason = this.getCurrentSeason();
      const seasonCount = seasonStats.find(
        (s: any) => s.season.toLowerCase() === currentSeason,
      );

      if (!seasonCount || seasonCount.count < 5) {
        insights.push({
          type: 'suggestion',
          severity: 'low',
          title: `Low ${currentSeason} wardrobe`,
          description: `You have few garments tagged for ${currentSeason}. Consider adding seasonal pieces.`,
          metric: seasonCount?.count || 0,
          action: 'view_season',
        });
      }
    }

    if (usageStats.unused_180d > 0) {
      insights.push({
        type: 'warning',
        severity: usageStats.unused_180d > 10 ? 'high' : 'medium',
        title: `${usageStats.unused_180d} garments unused for 6+ months`,
        description: 'These items may no longer fit your style. Review and declutter.',
        metric: usageStats.unused_180d,
        action: 'view_long_unused',
      });
    }

    return insights;
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  async getTrendDetection(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         DATE_TRUNC('month', created_at)::date AS month,
         type,
         COUNT(*)::int AS count
       FROM garments
       WHERE user_id = $1 AND deleted_at IS NULL
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY month, type
       ORDER BY month DESC, count DESC`,
      [userId],
    );
    return result.rows;
  }

  async getEngagementFunnels(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         (SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL) AS garments_added,
         (SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND deleted_at IS NULL) AS outfits_created,
         (SELECT COUNT(DISTINCT event_date) FROM calendar_events WHERE user_id = $1) AS days_planned,
         (SELECT COUNT(*) FROM outfit_wear_history WHERE user_id = $1) AS outfits_worn,
         (SELECT COUNT(*) FROM recommendation_feedback WHERE user_id = $1 AND action IN ('accepted', 'worn')) AS recs_accepted`,
      [userId],
    );
    return result.rows[0] || {};
  }

  async getRetentionMetrics(): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         DATE_TRUNC('week', created_at)::date AS week,
         COUNT(DISTINCT user_id) FILTER (
           WHERE created_at >= NOW() - INTERVAL '7 days'
         ) AS new_users,
         COUNT(DISTINCT user_id) FILTER (
           WHERE created_at >= NOW() - INTERVAL '7 days'
             AND EXISTS (
               SELECT 1 FROM garments g2
               WHERE g2.user_id = users.id AND g2.deleted_at IS NULL
             )
         ) AS retained_users
       FROM users
       WHERE created_at >= NOW() - INTERVAL '90 days'
       GROUP BY week
       ORDER BY week DESC
       LIMIT 13`,
    );
    return result.rows;
  }

  async getUploadCompletionAnalytics(): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total_uploads,
         COUNT(*) FILTER (WHERE ai_confidence >= 0.8)::int AS high_confidence,
         COUNT(*) FILTER (WHERE ai_confidence < 0.8 AND ai_confidence > 0)::int AS low_confidence,
         COUNT(*) FILTER (WHERE ai_confidence IS NULL)::int AS pending_processing,
         AVG(ai_processing_duration_ms)::float AS avg_processing_ms
       FROM garments
       WHERE image_url IS NOT NULL AND deleted_at IS NULL
         AND created_at >= NOW() - INTERVAL '30 days'`,
    );
    return result.rows[0] || {};
  }

  async getAICorrectionAnalytics(): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total_classified,
         COUNT(*) FILTER (WHERE ai_classification IS NOT NULL)::int AS with_ai,
         COUNT(*) FILTER (WHERE ai_classification IS NULL)::int AS manual_only,
         AVG(ai_confidence)::float AS avg_confidence
       FROM garments
       WHERE deleted_at IS NULL`,
    );
    return result.rows[0] || {};
  }
}
