import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class VectorSearchService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async findSimilarByEmbedding(
    userId: string,
    embedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
  ): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url, thumbnail_url,
               embedding <=> $1::vector AS distance
       FROM garments
       WHERE user_id = $2
         AND deleted_at IS NULL
         AND embedding IS NOT NULL
         AND embedding <=> $1::vector < $3
       ORDER BY distance ASC
       LIMIT $4`,
      [embedding, userId, 1 - threshold, limit],
    );
    return result.rows.map((r) => ({
      ...r,
      similarity: 1 - r.distance,
    }));
  }

  async findSimilarByColor(
    userId: string,
    colorHex: string,
    limit: number = 10,
  ): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url, thumbnail_url
       FROM garments
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND dominant_colors_hex @> ARRAY[$2]::text[]
       ORDER BY usage_count ASC
       LIMIT $3`,
      [userId, colorHex, limit],
    );
    return result.rows;
  }

  async findSimilarByCategory(
    userId: string,
    category: string,
    limit: number = 10,
  ): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url, thumbnail_url, usage_count
       FROM garments
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND type = $2
       ORDER BY usage_count ASC
       LIMIT $3`,
      [userId, category, limit],
    );
    return result.rows;
  }

  async semanticSearch(
    userId: string,
    queryEmbedding: number[],
    categoryFilter?: string,
    colorFilter?: string,
    limit: number = 20,
  ): Promise<any[]> {
    const conditions: string[] = [
      'user_id = $1',
      'deleted_at IS NULL',
      'embedding IS NOT NULL',
    ];
    const params: any[] = [userId, queryEmbedding];
    let paramIndex = 3;

    if (categoryFilter) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(categoryFilter);
    }

    if (colorFilter) {
      conditions.push(`dominant_colors_hex @> ARRAY[$${paramIndex++}]::text[]`);
      params.push(colorFilter);
    }

    const whereClause = conditions.join(' AND ');
    const orderClause = `ORDER BY embedding <=> $2::vector ASC`;

    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url, thumbnail_url,
               dominant_colors_hex, style_tags, season_tags,
               embedding <=> $2::vector AS distance
       FROM garments
       WHERE ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex}`,
      [...params, limit],
    );

    return result.rows.map((r) => ({
      ...r,
      similarity: 1 - r.distance,
    }));
  }

  async findPotentialDuplicates(
    userId: string,
    embedding: number[],
    threshold: number = 0.92,
  ): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url,
               embedding <=> $1::vector AS distance
       FROM garments
       WHERE user_id = $2
         AND deleted_at IS NULL
         AND embedding IS NOT NULL
         AND embedding <=> $1::vector < $3
       ORDER BY distance ASC`,
      [embedding, userId, 1 - threshold],
    );
    return result.rows.map((r) => ({
      ...r,
      similarity: 1 - r.distance,
      isDuplicate: r.distance < 0.05,
    }));
  }

  async getUnusedGarments(userId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url, thumbnail_url, usage_count,
              created_at, last_used_at
       FROM garments
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND (usage_count = 0 OR last_used_at IS NULL)
       ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async getOverusedGarments(userId: string, threshold: number = 20): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, color, image_url, thumbnail_url, usage_count, last_used_at
       FROM garments
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND usage_count > $2
       ORDER BY usage_count DESC`,
      [userId, threshold],
    );
    return result.rows;
  }

  async getColorPaletteClusters(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT dominant_colors_hex, COUNT(*)::int AS count
       FROM garments
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND array_length(dominant_colors_hex, 1) > 0
       GROUP BY dominant_colors_hex
       ORDER BY count DESC
       LIMIT 20`,
      [userId],
    );
    return result.rows;
  }
}
