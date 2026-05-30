import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

interface ScoredGarment {
  id: string;
  name: string;
  type: string;
  color: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  usage_count: number;
  last_used_at: Date | null;
  dominant_colors_hex: string[];
  style_tags: string[];
  season_tags: string[];
  occasion_tags: string[];
  embedding_similarity: number;
  contextual_score: number;
}

interface RecommendationExplanation {
  reasons: string[];
  confidence: number;
  matchingFactors: string[];
  colorHarmony: number;
  rotationScore: number;
  diversityBonus: number;
}

interface ScoredOutfit {
  garments: any[];
  totalScore: number;
  breakdown: {
    contextual: number;
    colorHarmony: number;
    rotation: number;
    diversity: number;
    preference: number;
    recency: number;
  };
  explanations: RecommendationExplanation[];
}

const UPPER_TYPES = ['shirt', 'dresses', 'jackets', 'sportswear', 'formalwear'];
const LOWER_TYPES = ['pants'];
const FOOTWEAR_TYPES = ['shoes'];
const ACCESSORY_TYPES = ['accessories', 'bags', 'belts', 'hats'];

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async recommend(
    userId: string,
    options: {
      excludeGarmentIds?: string[];
      occasion?: string;
      season?: string;
      temperature?: number;
      count?: number;
      preferRecentlyWorn?: boolean;
    } = {},
  ): Promise<any> {
    const excludeIds = options.excludeGarmentIds ?? [];
    const count = Math.min(options.count ?? 5, 20);

    const garmentsResult = await this.pool.query<any>(
      `SELECT id, name, type, state, color, usage_count, last_used_at,
              dominant_colors_hex, style_tags, season_tags, occasion_tags,
              image_url, thumbnail_url
       FROM garments
       WHERE user_id = $1 AND state = 'available' AND deleted_at IS NULL`,
      [userId],
    );

    let garments = garmentsResult.rows;
    if (excludeIds.length > 0) {
      garments = garments.filter((g: any) => !excludeIds.includes(g.id));
    }

    const upper = garments.filter((g: any) => UPPER_TYPES.includes(g.type));
    const lower = garments.filter((g: any) => LOWER_TYPES.includes(g.type));
    const footwear = garments.filter((g: any) => FOOTWEAR_TYPES.includes(g.type));
    const accessories = garments.filter((g: any) => ACCESSORY_TYPES.includes(g.type));

    const scoredOutfits: ScoredOutfit[] = [];

    for (const u of upper) {
      for (const l of lower) {
        if (u.id === l.id) continue;

        const colorHarmony = this.calculateColorHarmony(u, l);
        const rotationScore = this.calculateRotationScore([u, l]);
        const contextualScore = this.calculateContextualScore(
          [u, l],
          options.occasion,
          options.season,
        );
        const preferenceScore = this.calculatePreferenceScore(
          [u, l],
          options.temperature,
        );
        const recencyScore = options.preferRecentlyWorn
          ? this.calculateRecencyScore([u, l])
          : 1.0;
        const diversityScore = this.calculateDiversityScore(scoredOutfits, [u, l]);

        const totalScore =
          contextualScore * 0.25 +
          colorHarmony * 0.25 +
          rotationScore * 0.20 +
          preferenceScore * 0.10 +
          recencyScore * 0.10 +
          diversityScore * 0.10;

        const shoe = footwear.find(
          (f: any) => !scoredOutfits.some((s) =>
            s.garments.some((g: any) => g.id === f.id),
          ),
        );

        const accs = accessories.filter(
          (a: any) => !scoredOutfits.some((s) =>
            s.garments.some((g: any) => g.id === a.id),
          ),
        );

        const selectedGarments = [u, l];
        if (shoe) selectedGarments.push(shoe);
        if (accs.length > 0) selectedGarments.push(accs[0]);

        const explanations = this.generateExplanations(
          [u, l],
          {
            contextual: contextualScore,
            colorHarmony,
            rotation: rotationScore,
            diversity: diversityScore,
            preference: preferenceScore,
            recency: recencyScore,
          },
          options.occasion,
          options.season,
        );

        scoredOutfits.push({
          garments: selectedGarments,
          totalScore,
          breakdown: {
            contextual: contextualScore,
            colorHarmony,
            rotation: rotationScore,
            diversity: diversityScore,
            preference: preferenceScore,
            recency: recencyScore,
          },
          explanations,
        });
      }
    }

    scoredOutfits.sort((a, b) => b.totalScore - a.totalScore);

    const topOutfits = scoredOutfits.slice(0, count);

    const availableUpperCount = upper.length;
    const availableLowerCount = lower.length;

    let warning: string | null = null;
    if (availableUpperCount === 0 && availableLowerCount === 0) {
      warning = 'No available garments found. Check laundry or add new garments.';
    } else if (availableUpperCount === 0) {
      warning = 'No upper body garments available.';
    } else if (availableLowerCount === 0) {
      warning = 'No lower body garments available.';
    }

    const result = {
      suggestions: topOutfits.map((o) => ({
        garments: o.garments.map((g: any) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          color: g.color,
          image_url: g.image_url,
          thumbnail_url: g.thumbnail_url,
        })),
        score: Number(o.totalScore.toFixed(4)),
        breakdown: o.breakdown,
        explanations: o.explanations,
      })),
      meta: {
        total_suggestions: topOutfits.length,
        available_upper_count: availableUpperCount,
        available_lower_count: availableLowerCount,
        warning,
        algorithm_version: 'v2-ml-assisted',
      },
    };

    await this.cacheRecommendations(userId, options, result);

    return result;
  }

  private calculateColorHarmony(u: any, l: any): number {
    const uColors: string[] = u.dominant_colors_hex || [];
    const lColors: string[] = l.dominant_colors_hex || [];
    const allColors = [...uColors, ...lColors].filter(Boolean);

    if (allColors.length < 2) return 0.5;

    const hues = allColors.map((hex) => this.hexToHue(hex)).filter((h) => h !== null) as number[];
    if (hues.length <= 1) return 0.9;

    let totalScore = 0;
    let pairs = 0;

    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const angle = Math.abs(hues[i] - hues[j]);
        const normalizedAngle = Math.min(angle, 360 - angle);
        totalScore += this.getHarmonyScore(normalizedAngle);
        pairs++;
      }
    }

    return pairs > 0 ? totalScore / pairs : 0.5;
  }

  private hexToHue(hex: string): number | null {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max === min) return null;

    let hue = 0;
    const delta = max - min;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;

    return ((hue * 60) % 360 + 360) % 360;
  }

  private getHarmonyScore(angle: number): number {
    if (angle <= 10) return 0.9;
    if (angle <= 60) return 1.0;
    if (Math.abs(angle - 180) <= 30) return 1.0;
    if (Math.abs(angle - 120) <= 15) return 0.7;
    if (angle >= 60 && angle <= 90) return 0.3;
    return 0.5;
  }

  private calculateRotationScore(garments: any[]): number {
    const scores = garments.map((g) => {
      if (!g.last_used_at) return 1.0;
      const daysSinceWorn = Math.floor(
        (Date.now() - new Date(g.last_used_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      const score = Math.min(daysSinceWorn / 30, 1.0);
      if (g.usage_count === 0) return Math.max(score, 0.8);
      return score;
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private calculateContextualScore(
    garments: any[],
    occasion?: string,
    season?: string,
  ): number {
    let score = 0.5;
    let factors = 0;

    if (occasion) {
      const occasionMatch = garments.some((g) =>
        (g.occasion_tags || []).some((t: string) =>
          t.toLowerCase().includes(occasion.toLowerCase()),
        ),
      );
      score += occasionMatch ? 0.4 : -0.1;
      factors++;
    }

    if (season) {
      const seasonMatch = garments.some((g) =>
        (g.season_tags || []).some((t: string) =>
          t.toLowerCase().includes(season.toLowerCase()),
        ),
      );
      score += seasonMatch ? 0.3 : -0.1;
      factors++;
    }

    return factors > 0 ? Math.max(0, Math.min(1, score)) : 0.5;
  }

  private calculatePreferenceScore(garments: any[], temperature?: number): number {
    if (temperature === undefined) return 0.5;

    if (temperature > 25) {
      const hasLight = garments.some((g) =>
        ['shirt', 't-shirts', 'shorts', 'dresses'].includes(g.type),
      );
      return hasLight ? 0.9 : 0.3;
    }

    if (temperature < 10) {
      const hasWarm = garments.some((g) =>
        ['jackets', 'coats', 'sweaters'].includes(g.type),
      );
      return hasWarm ? 0.9 : 0.3;
    }

    return 0.7;
  }

  private calculateRecencyScore(garments: any[]): number {
    const scores = garments.map((g) => {
      if (!g.last_used_at) return 0.3;
      const daysSinceWorn = Math.floor(
        (Date.now() - new Date(g.last_used_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      return Math.max(0, 1 - daysSinceWorn / 14);
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private calculateDiversityScore(existing: ScoredOutfit[], newGarments: any[]): number {
    if (existing.length === 0) return 1.0;

    const newIds = new Set(newGarments.map((g) => g.id));
    const maxOverlap = Math.max(
      ...existing.map((o) =>
        o.garments.filter((g: any) => newIds.has(g.id)).length,
      ),
    );

    return 1 - maxOverlap / newGarments.length;
  }

  private generateExplanations(
    garments: any[],
    breakdown: ScoredOutfit['breakdown'],
    occasion?: string,
    season?: string,
  ): RecommendationExplanation[] {
    const reasons: string[] = [];
    const matchingFactors: string[] = [];

    if (breakdown.colorHarmony > 0.8) {
      reasons.push('Colors complement each other well');
      matchingFactors.push('color_harmony');
    }

    if (breakdown.rotation > 0.7) {
      const wornGarments = garments.filter((g) => g.last_used_at);
      if (wornGarments.length > 0) {
        reasons.push('Includes garments not worn recently');
        matchingFactors.push('rotation');
      } else {
        reasons.push('Features unworn garments — perfect to try something new');
        matchingFactors.push('new_garment');
      }
    }

    if (occasion) {
      reasons.push(`Recommended for ${occasion}`);
      matchingFactors.push('occasion');
    }

    if (season) {
      reasons.push(`Suitable for ${season}`);
      matchingFactors.push('season');
    }

    if (breakdown.contextual > 0.7) {
      reasons.push('Matches your style preferences');
      matchingFactors.push('preference');
    }

    if (reasons.length === 0) {
      reasons.push('Balanced outfit from your wardrobe');
      matchingFactors.push('balanced');
    }

    return [
      {
        reasons,
        confidence: Number(
          (
            breakdown.contextual * 0.3 +
            breakdown.colorHarmony * 0.3 +
            breakdown.rotation * 0.2 +
            breakdown.diversity * 0.2
          ).toFixed(3),
        ),
        matchingFactors,
        colorHarmony: breakdown.colorHarmony,
        rotationScore: breakdown.rotation,
        diversityBonus: breakdown.diversity,
      },
    ];
  }

  private async cacheRecommendations(
    userId: string,
    options: any,
    result: any,
  ): Promise<void> {
    try {
      const contextStr = JSON.stringify({
        occasion: options.occasion,
        season: options.season,
        count: options.count,
      });
      const crypto = await import('crypto');
      const contextHash = crypto
        .createHash('sha256')
        .update(contextStr)
        .digest('hex');

      await this.pool.query(
        `INSERT INTO recommendation_cache (user_id, context_hash, recommendations, total_count)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, context_hash)
         DO UPDATE SET recommendations = $3, total_count = $4, generated_at = NOW(), expires_at = NOW() + INTERVAL '30 minutes'`,
        [userId, contextHash, JSON.stringify(result.suggestions), result.meta.total_suggestions],
      );
    } catch {
      // Cache failures are non-critical
    }
  }

  async recordFeedback(
    userId: string,
    feedback: {
      outfitId?: string;
      garmentIds: string[];
      action: 'accepted' | 'rejected' | 'worn' | 'saved' | 'dismissed';
      confidenceScore?: number;
      sessionId?: string;
    },
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO recommendation_feedback
       (user_id, outfit_id, garment_ids, action, confidence_score, session_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        feedback.outfitId || null,
        feedback.garmentIds,
        feedback.action,
        feedback.confidenceScore || 0,
        feedback.sessionId || null,
      ],
    );

    if (feedback.action === 'worn') {
      await this.recordWear(userId, feedback);
    }
  }

  async recordWear(
    userId: string,
    data: {
      outfitId?: string;
      garmentIds: string[];
      source?: string;
    },
  ): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];

    for (const garmentId of data.garmentIds) {
      await this.pool.query(
        `UPDATE garments
         SET usage_count = usage_count + 1,
             last_used_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [garmentId, userId],
      );
    }

    if (data.outfitId) {
      await this.pool.query(
        `INSERT INTO outfit_wear_history (outfit_id, user_id, worn_date, source)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (outfit_id, worn_date) DO NOTHING`,
        [data.outfitId, userId, todayStr, data.source || 'manual'],
      );
    }
  }

  async getRecommendationMetrics(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE action = 'accepted') AS accepted_count,
         COUNT(*) FILTER (WHERE action = 'rejected') AS rejected_count,
         COUNT(*) FILTER (WHERE action = 'worn') AS worn_count,
         COUNT(*) FILTER (WHERE action = 'dismissed') AS dismissed_count,
         COUNT(*) AS total,
         AVG(confidence_score)::float AS avg_confidence
       FROM recommendation_feedback
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '90 days'`,
      [userId],
    );

    const row = result.rows[0] || {};
    const total = parseInt(row.total || '0', 10);
    const accepted = parseInt(row.accepted_count || '0', 10);
    const rejected = parseInt(row.rejected_count || '0', 10);
    const worn = parseInt(row.worn_count || '0', 10);

    return {
      total_recommendations: total,
      accepted_count: accepted,
      rejected_count: rejected,
      worn_count: worn,
      ctr: total > 0 ? Number((accepted / total).toFixed(4)) : 0,
      rejection_rate: total > 0 ? Number((rejected / total).toFixed(4)) : 0,
      avg_confidence: row.avg_confidence || 0,
    };
  }
}
