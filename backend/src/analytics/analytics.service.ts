import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryUsageAnalyticsDto } from './dto/query-usage-analytics.dto';

const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async getGarmentAnalytics(userId: string): Promise<any> {
    const totalResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    const totalGarments = parseInt(totalResult.rows[0].count, 10);

    const typeResult = await this.pool.query<{ type: string; count: string }>(
      `SELECT type, COUNT(*)::text AS count FROM garments WHERE user_id = $1 AND deleted_at IS NULL GROUP BY type`,
      [userId],
    );
    const typeMap = new Map(typeResult.rows.map((r) => [r.type, parseInt(r.count, 10)]));

    const stateResult = await this.pool.query<{ state: string; count: string }>(
      `SELECT state, COUNT(*)::text AS count FROM garments WHERE user_id = $1 AND deleted_at IS NULL GROUP BY state`,
      [userId],
    );
    const stateMap = new Map(stateResult.rows.map((r) => [r.state, parseInt(r.count, 10)]));

    const allTypes = ['shirt', 'pants', 'shoes', 'jackets', 'accessories', 'dresses', 'sportswear', 'formalwear'];
    const allStates = ['available', 'washing', 'laundry_basket', 'borrowed', 'stored', 'repair'];

    const typeBreakdown: Record<string, number> = {};
    for (const t of allTypes) {
      typeBreakdown[t] = typeMap.get(t) ?? 0;
    }

    const stateBreakdown: Record<string, number> = {};
    for (const s of allStates) {
      stateBreakdown[s] = stateMap.get(s) ?? 0;
    }

    const mostUsedResult = await this.pool.query<any>(
      `SELECT id, name, type, usage_count FROM garments WHERE user_id = $1 AND deleted_at IS NULL ORDER BY usage_count DESC LIMIT 5`,
      [userId],
    );

    const leastUsedResult = await this.pool.query<any>(
      `SELECT id, name, type, usage_count FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND usage_count > 0 ORDER BY usage_count ASC LIMIT 5`,
      [userId],
    );

    const neverUsedResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND usage_count = 0`,
      [userId],
    );
    const neverUsed = parseInt(neverUsedResult.rows[0].count, 10);

    const avgResult = await this.pool.query<{ avg: string | null }>(
      `SELECT AVG(usage_count)::text AS avg FROM garments WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    const avgUsagePerGarment = avgResult.rows[0].avg ? parseFloat(avgResult.rows[0].avg) : 0;

    return {
      total_garments: totalGarments,
      type_breakdown: typeBreakdown,
      state_breakdown: stateBreakdown,
      most_used: mostUsedResult.rows,
      least_used: leastUsedResult.rows,
      never_used: neverUsed,
      avg_usage_per_garment: avgUsagePerGarment,
    };
  }

  async getUsageAnalytics(userId: string, query: QueryUsageAnalyticsDto): Promise<any> {
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const periodDays = daysMap[query.period ?? '30d'];

    const outfitResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2`,
      [userId, periodDays],
    );
    const totalOutfitsCreated = parseInt(outfitResult.rows[0].count, 10);

    const garmentResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2`,
      [userId, periodDays],
    );
    const totalGarmentsAdded = parseInt(garmentResult.rows[0].count, 10);

    const wornResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM calendar_events WHERE user_id = $1 AND is_worn = true AND event_date >= CURRENT_DATE - INTERVAL '1 day' * $2`,
      [userId, periodDays],
    );
    const totalOutfitsWorn = parseInt(wornResult.rows[0].count, 10);

    const storageResult = await this.pool.query<{ total: string | null }>(
      `SELECT SUM(LENGTH(COALESCE(image_url, '')) + LENGTH(COALESCE(thumbnail_url, '')))::text AS total FROM garments WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    const storageUsedBytes = storageResult.rows[0].total ? parseInt(storageResult.rows[0].total, 10) : 0;

    const activityResult = await this.pool.query<{ day: string }>(
      `SELECT DISTINCT DATE(created_at)::text AS day FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2
       UNION
       SELECT DISTINCT DATE(created_at)::text AS day FROM outfits WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2
       UNION
       SELECT DISTINCT event_date::text AS day FROM calendar_events WHERE user_id = $1 AND event_date >= CURRENT_DATE - INTERVAL '1 day' * $2
       ORDER BY day DESC`,
      [userId, periodDays],
    );
    const activeDays = activityResult.rows.map((r) => r.day);

    const todayStr = new Date().toISOString().split('T')[0];
    let streak = 0;
    const currentDate = new Date(todayStr);
    for (let i = 0; ; i++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (activeDays.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return {
      total_logins: 0,
      total_outfits_created: totalOutfitsCreated,
      total_garments_added: totalGarmentsAdded,
      total_outfits_worn: totalOutfitsWorn,
      most_active_day: null,
      storage_used_bytes: storageUsedBytes,
      storage_remaining_bytes: STORAGE_LIMIT_BYTES - storageUsedBytes,
      streak_days: streak,
    };
  }

  async getDashboardAnalytics(userId: string, query: QueryDashboardDto): Promise<any> {
    const periodDaysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = periodDaysMap[query.period ?? '30d'];
    const halfDays = Math.floor(days / 2);

    const [[gTotal], [oTotal], [aTotal], [sSched]] = await Promise.all([
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId],
      ).then((r) => r.rows),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId],
      ).then((r) => r.rows),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM avatars WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId],
      ).then((r) => r.rows),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT event_date) FROM calendar_events WHERE user_id = $1`,
        [userId],
      ).then((r) => r.rows),
    ]);

    const activityResult = await this.pool.query<{ day: string; actions: string }>(
      `SELECT day, COUNT(*) AS actions FROM (
         SELECT DATE(created_at)::text AS day FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2
         UNION ALL
         SELECT DATE(created_at)::text AS day FROM outfits WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2
         UNION ALL
         SELECT event_date::text AS day FROM calendar_events WHERE user_id = $1 AND event_date >= CURRENT_DATE - INTERVAL '1 day' * $2
       ) sub GROUP BY day ORDER BY day DESC LIMIT 14`,
      [userId, days],
    );

    const [gCurr, gPrev, oCurr, oPrev] = await Promise.all([
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2`,
        [userId, halfDays],
      ).then((r) => parseInt(r.rows[0].count, 10)),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND created_at < NOW() - INTERVAL '1 day' * $2 AND created_at >= NOW() - INTERVAL '1 day' * $3`,
        [userId, halfDays, days],
      ).then((r) => parseInt(r.rows[0].count, 10)),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day' * $2`,
        [userId, halfDays],
      ).then((r) => parseInt(r.rows[0].count, 10)),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND deleted_at IS NULL AND created_at < NOW() - INTERVAL '1 day' * $2 AND created_at >= NOW() - INTERVAL '1 day' * $3`,
        [userId, halfDays, days],
      ).then((r) => parseInt(r.rows[0].count, 10)),
    ]);

    const trend = (curr: number, prev: number): 'up' | 'down' | 'stable' => {
      if (curr > prev) return 'up';
      if (curr < prev) return 'down';
      return 'stable';
    };

    const totalGarments = parseInt(gTotal?.count ?? '0', 10);
    const totalOutfits = parseInt(oTotal?.count ?? '0', 10);
    const totalAvatars = parseInt(aTotal?.count ?? '0', 10);
    const scheduledDays = parseInt(sSched?.count ?? '0', 10);

    const totalDaysInPeriod = days;
    const completionRate = totalDaysInPeriod > 0
      ? Math.round((Math.min(scheduledDays, totalDaysInPeriod) / totalDaysInPeriod) * 100)
      : 0;

    const weekResult = await this.pool.query<{ g: string; o: string }>(
      `SELECT
         (SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days') AS g,
         (SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days') AS o`,
      [userId],
    );

    const recommendations: Array<{ type: string; message: string; icon: string }> = [];
    if (totalGarments === 0) {
      recommendations.push({ type: 'tip', message: 'Agrega tu primera prenda para comenzar', icon: 'plus-circle' });
    } else if (totalOutfits === 0) {
      recommendations.push({ type: 'tip', message: 'Crea tu primer outfit combinando prendas', icon: 'sparkles' });
    }
    if (scheduledDays > 0) {
      recommendations.push({ type: 'achievement', message: `Has planificado ${scheduledDays} día(s) en el calendario`, icon: 'calendar-check' });
    }

    return {
      summary: {
        total_garments: totalGarments,
        total_outfits: totalOutfits,
        total_avatars: totalAvatars,
        scheduled_days: scheduledDays,
        recent_activity: activityResult.rows.map((r) => ({
          date: r.day,
          actions: parseInt(r.actions, 10),
        })),
      },
      trends: {
        garments_trend: trend(gCurr, gPrev),
        outfits_trend: trend(oCurr, oPrev),
        usage_trend: trend(gCurr + oCurr, gPrev + oPrev),
      },
      recommendations,
      quick_stats: {
        garments_this_week: parseInt(weekResult.rows[0]?.g ?? '0', 10),
        outfits_this_week: parseInt(weekResult.rows[0]?.o ?? '0', 10),
        completion_rate: completionRate,
      },
    };
  }

  async getAIPrecisionAnalytics(userId: string): Promise<any> {
    const processedResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND image_url IS NOT NULL`,
      [userId],
    );
    const totalProcessed = parseInt(processedResult.rows[0].count, 10);

    const last24hResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE user_id = $1 AND deleted_at IS NULL AND image_url IS NOT NULL AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId],
    );
    const last24hCount = parseInt(last24hResult.rows[0].count, 10);

    const successRate = totalProcessed > 0 ? 100 : 0;

    return {
      total_processed: totalProcessed,
      successful: totalProcessed,
      failed: 0,
      success_rate: successRate,
      avg_processing_time_ms: null,
      classification_accuracy: null,
      detection_rate: null,
      last_24h_count: last24hCount,
    };
  }
}
