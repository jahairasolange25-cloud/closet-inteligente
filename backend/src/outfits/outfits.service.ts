import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { WebSocketGatewayImpl } from '../websocket/websocket.gateway';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { QueryOutfitsDto } from './dto/query-outfits.dto';
import { RecommendOutfitDto } from './dto/recommend-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';

interface GarmentRow {
  id: string;
  user_id: string;
  type: string;
  state: string;
  deleted_at: Date | null;
}

interface OutfitRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_complete: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const UPPER_BODY_TYPES = ['shirt', 'dresses', 'jackets', 'sportswear', 'formalwear'];
const LOWER_BODY_TYPES = ['pants'];
const FOOTWEAR_TYPES = ['shoes'];

const COLOR_GROUPS: Record<string, string> = {
  black: 'neutral',
  white: 'neutral',
  gray: 'neutral',
  grey: 'neutral',
  navy: 'neutral',
  red: 'warm',
  orange: 'warm',
  yellow: 'warm',
  brown: 'warm',
  beige: 'warm',
  blue: 'cool',
  green: 'cool',
  purple: 'cool',
  pink: 'cool',
};

@Injectable()
export class OutfitsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Optional() private readonly wsGateway?: WebSocketGatewayImpl,
  ) {}

  async create(userId: string, dto: CreateOutfitDto): Promise<any> {
    const garmentIds = [...new Set(dto.garment_ids)];

    const garmentsResult = await this.pool.query<GarmentRow>(
      `SELECT id, user_id, type, state, deleted_at FROM garments WHERE id = ANY($1::uuid[])`,
      [garmentIds],
    );

    const garmentsMap = new Map<string, GarmentRow>();
    for (const g of garmentsResult.rows) {
      garmentsMap.set(g.id, g);
    }

    const invalidGarments = garmentIds.filter((id) => {
      const g = garmentsMap.get(id);
      return !g || g.user_id !== userId || g.deleted_at !== null;
    });

    if (invalidGarments.length > 0) {
      throw new BadRequestException('SOME_GARMENTS_NOT_FOUND');
    }

    const washingGarments = garmentsResult.rows.filter((g) => g.state === 'washing');
    if (washingGarments.length > 0) {
      throw new BadRequestException('GARMENT_IN_WASHING');
    }

    const hasUpper = garmentsResult.rows.some((g) => UPPER_BODY_TYPES.includes(g.type));
    const hasLower = garmentsResult.rows.some((g) => LOWER_BODY_TYPES.includes(g.type));

    if (!hasUpper || !hasLower) {
      throw new BadRequestException('MISSING_UPPER_OR_LOWER_GARMENT');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const outfitResult = await client.query<OutfitRow>(
        `INSERT INTO outfits (user_id, name, type, is_complete)
         VALUES ($1, $2, $3, true)
         RETURNING *`,
        [userId, dto.name.trim(), dto.type],
      );

      const outfit = outfitResult.rows[0];

      for (let i = 0; i < garmentIds.length; i++) {
        await client.query(
          `INSERT INTO outfit_garments (outfit_id, garment_id, position)
           VALUES ($1, $2, $3)`,
          [outfit.id, garmentIds[i], i + 1],
        );
      }

      await client.query('COMMIT');

      const garmentsWithDetails = garmentsResult.rows.map((g) => ({
        id: g.id,
        type: g.type,
        state: g.state,
      }));

      const result = {
        ...outfit,
        garments: garmentsWithDetails,
      };
      this.wsGateway?.emitOutfitCreated(userId, result);
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(userId: string, query: QueryOutfitsDto): Promise<PaginatedResult<any>> {
    const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (query.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(query.type);
    }

    if (query.is_complete !== undefined) {
      conditions.push(`is_complete = $${paramIndex++}`);
      params.push(query.is_complete);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM outfits WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const sortBy = query.sortBy ?? 'created_at';
    const sortOrder = query.sortOrder ?? 'desc';
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = ((query.page ?? 1) - 1) * limit;

    const orderClause = sortBy === 'name'
      ? `ORDER BY name ${sortOrder} NULLS LAST, id ${sortOrder}`
      : `ORDER BY ${sortBy} ${sortOrder}, id ${sortOrder}`;

    const outfitsResult = await this.pool.query<OutfitRow>(
      `SELECT * FROM outfits WHERE ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, skip],
    );

    const outfits = outfitsResult.rows;
    const outfitIds = outfits.map((o) => o.id);

    let garmentsByOutfit: Map<string, any[]> = new Map();

    if (outfitIds.length > 0) {
      const garmentsResult = await this.pool.query<any>(
        `SELECT og.outfit_id, og.position, g.id, g.name, g.type, g.state, g.color, g.image_url, g.thumbnail_url
         FROM outfit_garments og
         JOIN garments g ON g.id = og.garment_id AND g.deleted_at IS NULL
         WHERE og.outfit_id = ANY($1::uuid[])
         ORDER BY og.position ASC`,
        [outfitIds],
      );

      for (const row of garmentsResult.rows) {
        const existing = garmentsByOutfit.get(row.outfit_id) || [];
        existing.push({
          id: row.id,
          name: row.name,
          type: row.type,
          state: row.state,
          color: row.color,
          image_url: row.image_url,
          thumbnail_url: row.thumbnail_url,
          position: row.position,
        });
        garmentsByOutfit.set(row.outfit_id, existing);
      }
    }

    const data = outfits.map((outfit) => ({
      id: outfit.id,
      name: outfit.name,
      type: outfit.type,
      is_complete: outfit.is_complete,
      version: outfit.version,
      created_at: outfit.created_at,
      updated_at: outfit.updated_at,
      garments: garmentsByOutfit.get(outfit.id) || [],
    }));

    const page = query.page ?? 1;
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(userId: string, outfitId: string): Promise<any> {
    const outfitResult = await this.pool.query<OutfitRow>(
      `SELECT * FROM outfits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [outfitId, userId],
    );

    if (!outfitResult.rows[0]) {
      throw new NotFoundException('OUTFIT_NOT_FOUND');
    }

    const outfit = outfitResult.rows[0];

    const garmentsResult = await this.pool.query<any>(
      `SELECT og.position, g.id, g.name, g.type, g.state, g.color, g.image_url, g.thumbnail_url, g.deleted_at
       FROM outfit_garments og
       JOIN garments g ON g.id = og.garment_id
       WHERE og.outfit_id = $1
       ORDER BY og.position ASC`,
      [outfitId],
    );

    const garments = garmentsResult.rows.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      state: g.state,
      color: g.color,
      image_url: g.image_url,
      thumbnail_url: g.thumbnail_url,
      position: g.position,
      deleted: g.deleted_at !== null,
    }));

    return {
      id: outfit.id,
      name: outfit.name,
      type: outfit.type,
      is_complete: outfit.is_complete,
      version: outfit.version,
      created_at: outfit.created_at,
      updated_at: outfit.updated_at,
      garments,
    };
  }

  async update(userId: string, outfitId: string, dto: UpdateOutfitDto): Promise<any> {
    const existingResult = await this.pool.query<OutfitRow>(
      `SELECT * FROM outfits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [outfitId, userId],
    );

    if (!existingResult.rows[0]) {
      throw new NotFoundException('OUTFIT_NOT_FOUND');
    }

    const existing = existingResult.rows[0];

    if (dto.expected_version !== undefined && dto.expected_version !== existing.version) {
      throw new ConflictException('VERSION_MISMATCH');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (dto.garment_ids !== undefined) {
        const garmentIds = [...new Set(dto.garment_ids)];

        const garmentsResult = await this.pool.query<GarmentRow>(
          `SELECT id, user_id, type, state, deleted_at FROM garments WHERE id = ANY($1::uuid[])`,
          [garmentIds],
        );

        const garmentsMap = new Map<string, GarmentRow>();
        for (const g of garmentsResult.rows) {
          garmentsMap.set(g.id, g);
        }

        const invalidGarments = garmentIds.filter((id) => {
          const g = garmentsMap.get(id);
          return !g || g.user_id !== userId || g.deleted_at !== null;
        });

        if (invalidGarments.length > 0) {
          throw new BadRequestException('SOME_GARMENTS_NOT_FOUND');
        }

        const washingGarments = garmentsResult.rows.filter((g) => g.state === 'washing');
        if (washingGarments.length > 0) {
          throw new BadRequestException('GARMENT_IN_WASHING');
        }

        const hasUpper = garmentsResult.rows.some((g) => UPPER_BODY_TYPES.includes(g.type));
        const hasLower = garmentsResult.rows.some((g) => LOWER_BODY_TYPES.includes(g.type));

        if (!hasUpper || !hasLower) {
          throw new BadRequestException('MISSING_UPPER_OR_LOWER_GARMENT');
        }

        await client.query(`DELETE FROM outfit_garments WHERE outfit_id = $1`, [outfitId]);

        for (let i = 0; i < garmentIds.length; i++) {
          await client.query(
            `INSERT INTO outfit_garments (outfit_id, garment_id, position) VALUES ($1, $2, $3)`,
            [outfitId, garmentIds[i], i + 1],
          );
        }
      }

      const sets: string[] = [`version = version + 1`];
      const params: any[] = [];
      let paramIndex = 1;

      if (dto.name !== undefined) {
        params.push(dto.name.trim());
        sets.push(`name = $${paramIndex++}`);
      }

      if (dto.type !== undefined) {
        params.push(dto.type);
        sets.push(`type = $${paramIndex++}`);
      }

      if (dto.garment_ids !== undefined) {
        params.push(true);
        sets.push(`is_complete = $${paramIndex++}`);
      }

      params.push(outfitId);
      await client.query(
        `UPDATE outfits SET ${sets.join(', ')} WHERE id = $${paramIndex}`,
        params,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const updated = await this.findOne(userId, outfitId);
    this.wsGateway?.emitOutfitUpdated(userId, updated);
    return updated;
  }

  async getDailyOutfit(userId: string): Promise<any> {
    const todayStr = new Date().toISOString().split('T')[0];

    const eventResult = await this.pool.query<any>(
      `SELECT ce.id, ce.outfit_id, ce.event_date, ce.title, ce.notes, ce.is_worn
       FROM calendar_events ce
       WHERE ce.user_id = $1 AND ce.event_date = $2 AND ce.outfit_id IS NOT NULL
       ORDER BY ce.created_at DESC
       LIMIT 1`,
      [userId, todayStr],
    );

    if (!eventResult.rows[0]) {
      return {
        outfit: null,
        suggestion: {
          message: 'No outfit planned for today.',
          actions: [
            { label: 'Get recommendation', method: 'POST', path: '/outfits/recommend' },
            { label: 'Browse outfits', method: 'GET', path: '/outfits' },
          ],
        },
      };
    }

    const event = eventResult.rows[0];

    const outfitResult = await this.pool.query<any>(
      `SELECT id, name, type, is_complete, version, created_at, updated_at
       FROM outfits WHERE id = $1 AND deleted_at IS NULL`,
      [event.outfit_id],
    );

    if (!outfitResult.rows[0]) {
      return {
        outfit: null,
        suggestion: {
          message: 'Scheduled outfit has been deleted.',
          actions: [
            { label: 'Get recommendation', method: 'POST', path: '/outfits/recommend' },
          ],
        },
      };
    }

    const outfit = outfitResult.rows[0];

    const garmentsResult = await this.pool.query<any>(
      `SELECT g.id, g.name, g.type, g.state, g.color, g.image_url, g.thumbnail_url, og.position, g.deleted_at
       FROM outfit_garments og
       JOIN garments g ON g.id = og.garment_id
       WHERE og.outfit_id = $1
       ORDER BY og.position ASC`,
      [outfit.id],
    );

    const garments = garmentsResult.rows.map((g: any) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      state: g.state,
      color: g.color,
      image_url: g.image_url,
      thumbnail_url: g.thumbnail_url,
      position: g.position,
      deleted: g.deleted_at !== null,
    }));

    const problemGarments = garments.filter(
      (g: any) => !g.deleted && (g.state === 'washing' || g.state === 'repair'),
    );

    let warning: string | null = null;
    if (problemGarments.length > 0) {
      const names = problemGarments.map((g: any) => g.name).join(', ');
      warning = `Some garments may need attention: ${names}`;
    }

    return {
      outfit: {
        id: outfit.id,
        name: outfit.name,
        type: outfit.type,
        is_complete: outfit.is_complete,
        version: outfit.version,
        created_at: outfit.created_at,
        updated_at: outfit.updated_at,
        garments,
        warning,
      },
      suggestion: null,
    };
  }

  async recommend(userId: string, dto: RecommendOutfitDto): Promise<any> {
    const excludeIds = dto.exclude_garment_ids ?? [];

    const garmentsResult = await this.pool.query<any>(
      `SELECT id, name, type, state, color, usage_count, last_used_at
       FROM garments
       WHERE user_id = $1 AND state = 'available' AND deleted_at IS NULL`,
      [userId],
    );

    let garments = garmentsResult.rows;

    if (excludeIds.length > 0) {
      garments = garments.filter((g: any) => !excludeIds.includes(g.id));
    }

    const upperGarments = garments.filter((g: any) => UPPER_BODY_TYPES.includes(g.type));
    const lowerGarments = garments.filter((g: any) => LOWER_BODY_TYPES.includes(g.type));
    const footwearGarments = garments.filter((g: any) => FOOTWEAR_TYPES.includes(g.type));

    const sortFn = (a: any, b: any) => {
      if (a.usage_count !== b.usage_count) return a.usage_count - b.usage_count;
      if (!a.last_used_at) return -1;
      if (!b.last_used_at) return 1;
      return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime();
    };

    upperGarments.sort(sortFn);
    lowerGarments.sort(sortFn);
    footwearGarments.sort(sortFn);

    const getColorGroup = (color: string | null): string => {
      if (!color) return 'neutral';
      return COLOR_GROUPS[color.toLowerCase()] ?? 'neutral';
    };

    const areColorsCompatible = (c1: string | null, c2: string | null): boolean => {
      const g1 = getColorGroup(c1);
      const g2 = getColorGroup(c2);
      if (g1 === 'neutral' || g2 === 'neutral') return true;
      return g1 === g2;
    };

    const suggestions: any[] = [];

    for (let i = 0; i < upperGarments.length && suggestions.length < 3; i++) {
      const upper = upperGarments[i];

      for (let j = 0; j < lowerGarments.length && suggestions.length < 3; j++) {
        const lower = lowerGarments[j];

        if (upper.id === lower.id) continue;

        if (suggestions.some((s) => s.garments.some((g: any) => g.id === upper.id || g.id === lower.id))) continue;

        const compatible = areColorsCompatible(upper.color, lower.color);
        const garmentPairing = [upper, lower];

        const shoe = footwearGarments.find(
          (f) => !suggestions.some((s) => s.garments.some((g: any) => g.id === f.id)),
        );
        if (shoe) garmentPairing.push(shoe);

        const reason = compatible
          ? `Suggested ${upper.name} with ${lower.name} (compatible colors, low usage)`
          : `${upper.name} paired with ${lower.name} (color compromise, low usage)`;

        suggestions.push({
          garments: garmentPairing,
          reason,
        });
      }
    }

    const availableUpperCount = upperGarments.length;
    const availableLowerCount = lowerGarments.length;

    let warning: string | null = null;
    if (availableUpperCount === 0 && availableLowerCount === 0) {
      warning = 'No available garments found. Check laundry or add new garments.';
    } else if (availableUpperCount === 0) {
      warning = 'No upper body garments available (shirts, jackets, dresses, sportswear, formalwear).';
    } else if (availableLowerCount === 0) {
      warning = 'No lower body garments available (pants).';
    }

    const result = {
      suggestions,
      meta: {
        total_suggestions: suggestions.length,
        available_upper_count: availableUpperCount,
        available_lower_count: availableLowerCount,
        warning,
      },
    };
    this.wsGateway?.emitOutfitRecommended(userId, result);
    return result;
  }

  async softDelete(userId: string, outfitId: string): Promise<{ success: boolean; deleted_at: Date }> {
    const result = await this.pool.query<OutfitRow>(
      `UPDATE outfits SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING deleted_at`,
      [outfitId, userId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('OUTFIT_NOT_FOUND');
    }

    const deletedAt = result.rows[0].deleted_at!;
    this.wsGateway?.emitOutfitDeleted(userId, outfitId, deletedAt);
    return { success: true, deleted_at: deletedAt };
  }
}
