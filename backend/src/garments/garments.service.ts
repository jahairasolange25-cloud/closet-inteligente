import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { validateFileMagicBytes } from '../common/utils/file-magic';
import { PipelineService } from '../pipeline/pipeline.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { WebSocketGatewayImpl } from '../websocket/websocket.gateway';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { QueryGarmentsDto } from './dto/query-garments.dto';
import { SearchGarmentsDto } from './dto/search-garments.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';

export interface Garment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  state: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  season: string | null;
  usage_count: number;
  last_used_at: Date | null;
  image_url: string | null;
  thumbnail_url: string | null;
  is_favorite: boolean;
  pipeline_status: 'pending' | 'processing' | 'completed' | 'failed';
  notes: string | null;
  tags: string[];
  material: string[];
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

export interface GarmentResponse {
  id: string;
  userId: string;
  name: string;
  category: string;
  state: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  season: string | null;
  usageCount: number;
  lastUsedAt: Date | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  isFavorite: boolean;
  pipelineStatus: 'pending' | 'processing' | 'completed' | 'failed';
  notes: string | null;
  tags: string[];
  material: string[];
  createdAt: Date;
  updatedAt: Date;
}

function toGarmentResponse(g: Garment): GarmentResponse {
  return {
    id: g.id,
    userId: g.user_id,
    name: g.name,
    category: g.type,
    state: g.state,
    brand: g.brand,
    size: g.size,
    color: g.color,
    season: g.season,
    usageCount: g.usage_count,
    lastUsedAt: g.last_used_at,
    imageUrl: g.image_url,
    thumbnailUrl: g.thumbnail_url,
    isFavorite: g.is_favorite ?? false,
    pipelineStatus: g.pipeline_status ?? 'pending',
    notes: g.notes,
    tags: g.tags ?? [],
    material: g.material ?? [],
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  };
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_LIMIT = 100;
const MAX_CONCURRENT_UPLOADS = 3;

@Injectable()
export class GarmentsService {
  private readonly uploadSemaphore = new Map<string, number>();

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
    private readonly pipelineService: PipelineService,
    @Optional() private readonly wsGateway?: WebSocketGatewayImpl,
  ) {}

  async create(userId: string, dto: CreateGarmentDto): Promise<GarmentResponse> {
    const result = await this.pool.query<Garment>(
      `INSERT INTO garments (user_id, name, type, brand, size, color, season, notes, tags, material)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        dto.name.trim(),
        dto.category,
        dto.brand?.trim() ?? null,
        dto.size?.trim() ?? null,
        dto.color?.trim() ?? null,
        dto.season?.trim() ?? null,
        dto.notes?.trim() ?? null,
        dto.tags ?? [],
        dto.material ?? [],
      ],
    );
    const garment = result.rows[0];
    this.wsGateway?.emitGarmentCreated(userId, garment);
    return toGarmentResponse(garment);
  }

  async findAll(userId: string, query: QueryGarmentsDto): Promise<PaginatedResult<GarmentResponse>> {
    const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (query.category) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(query.category);
    }
    if (query.state) {
      conditions.push(`state = $${paramIndex++}`);
      params.push(query.state);
    }
    if (query.color) {
      conditions.push(`color = $${paramIndex++}`);
      params.push(query.color);
    }
    if (query.season) {
      conditions.push(`season = $${paramIndex++}`);
      params.push(query.season);
    }
    if (query.search) {
      conditions.push(`to_tsvector('spanish', name || ' ' || COALESCE(brand, '')) @@ plainto_tsquery('spanish', $${paramIndex++})`);
      params.push(query.search);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const sortBy = query.sortBy ?? 'created_at';
    const sortOrder = query.sortOrder ?? 'desc';
    const limit = Math.min(query.limit ?? 20, MAX_LIMIT);
    const skip = ((query.page ?? 1) - 1) * limit;

    const dataResult = await this.pool.query<Garment>(
      `SELECT * FROM garments WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST, id ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip],
    );

    const page = query.page ?? 1;
    return {
      data: dataResult.rows.map(toGarmentResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async findOne(userId: string, garmentId: string): Promise<GarmentResponse> {
    const result = await this.pool.query<Garment>(
      `SELECT * FROM garments WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [garmentId, userId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('GARMENT_NOT_FOUND');
    }
    return toGarmentResponse(result.rows[0]);
  }

  private async findOneRaw(userId: string, garmentId: string): Promise<Garment> {
    const result = await this.pool.query<Garment>(
      `SELECT * FROM garments WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [garmentId, userId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('GARMENT_NOT_FOUND');
    }
    return result.rows[0];
  }

  async update(userId: string, garmentId: string, dto: UpdateGarmentDto): Promise<GarmentResponse> {
    await this.findOneRaw(userId, garmentId);

    const sets: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      params.push(dto.name.trim());
    }
    if (dto.state !== undefined) {
      sets.push(`state = $${paramIndex++}`);
      params.push(dto.state);
    }
    if (dto.brand !== undefined) {
      sets.push(`brand = $${paramIndex++}`);
      params.push(dto.brand?.trim() ?? null);
    }
    if (dto.size !== undefined) {
      sets.push(`size = $${paramIndex++}`);
      params.push(dto.size?.trim() ?? null);
    }
    if (dto.color !== undefined) {
      sets.push(`color = $${paramIndex++}`);
      params.push(dto.color?.trim() ?? null);
    }
    if (dto.season !== undefined) {
      sets.push(`season = $${paramIndex++}`);
      params.push(dto.season?.trim() ?? null);
    }
    if (dto.isFavorite !== undefined) {
      sets.push(`is_favorite = $${paramIndex++}`);
      params.push(dto.isFavorite);
    }
    if (dto.notes !== undefined) {
      sets.push(`notes = $${paramIndex++}`);
      params.push(dto.notes?.trim() ?? null);
    }
    if (dto.tags !== undefined) {
      sets.push(`tags = $${paramIndex++}`);
      params.push(dto.tags);
    }
    if (dto.material !== undefined) {
      sets.push(`material = $${paramIndex++}`);
      params.push(dto.material);
    }

    if (sets.length === 0) {
      return this.findOne(userId, garmentId);
    }

    params.push(garmentId, userId);
    const result = await this.pool.query<Garment>(
      `UPDATE garments SET ${sets.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
      params,
    );
    const garment = result.rows[0];
    this.wsGateway?.emitGarmentUpdated(userId, garment);
    return toGarmentResponse(garment);
  }

  async search(userId: string, dto: SearchGarmentsDto): Promise<PaginatedResult<GarmentResponse>> {
    const conditions: string[] = [
      'user_id = $1',
      'deleted_at IS NULL',
      `to_tsvector('spanish', name || ' ' || COALESCE(brand, '')) @@ plainto_tsquery('spanish', $2)`,
    ];
    const params: any[] = [userId, dto.q];
    let paramIndex = 3;

    if (dto.category) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(dto.category);
    }
    if (dto.state) {
      conditions.push(`state = $${paramIndex++}`);
      params.push(dto.state);
    }
    if (dto.color) {
      conditions.push(`color = $${paramIndex++}`);
      params.push(dto.color);
    }
    if (dto.season) {
      conditions.push(`season = $${paramIndex++}`);
      params.push(dto.season);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM garments WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const rankExpr = `ts_rank(to_tsvector('spanish', name || ' ' || COALESCE(brand, '')), plainto_tsquery('spanish', $2))`;
    const limit = Math.min(dto.limit ?? 20, MAX_LIMIT);
    const skip = ((dto.page ?? 1) - 1) * limit;

    const dataResult = await this.pool.query<Garment>(
      `SELECT *, ${rankExpr} AS rank FROM garments WHERE ${whereClause} ORDER BY rank DESC, id ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip],
    );

    const page = dto.page ?? 1;
    return {
      data: dataResult.rows.map(toGarmentResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async validateFile(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException('INVALID_FILE_TYPE');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('FILE_TOO_LARGE');
    }
    try {
      validateFileMagicBytes(file, ALLOWED_MIME_TYPES);
    } catch (err: any) {
      throw new BadRequestException(err.message ?? 'INVALID_FILE_CONTENT');
    }
  }

  async upload(
    userId: string,
    garmentId: string,
    file: Express.Multer.File,
  ): Promise<{ upload_id: string; status: string }> {
    const currentCount = this.uploadSemaphore.get(userId) ?? 0;
    if (currentCount >= MAX_CONCURRENT_UPLOADS) {
      throw new BadRequestException('TOO_MANY_CONCURRENT_UPLOADS');
    }
    this.uploadSemaphore.set(userId, currentCount + 1);

    try {
      await this.findOneRaw(userId, garmentId);
      await this.validateFile(file);

      const uploadId = randomUUID();

      const { temp_url, file_hash } = await this.storageService.uploadTemp(file);

      await this.redisService.set(
        `upload:${uploadId}`,
        JSON.stringify({
          upload_id: uploadId,
          garment_id: garmentId,
          user_id: userId,
          status: 'pending',
          file_size: file.size,
          mime_type: file.mimetype,
          temp_url,
          file_hash,
          created_at: new Date().toISOString(),
        }),
        86400,
      );

      this.pipelineService.startPipeline(uploadId, garmentId, temp_url);

      return { upload_id: uploadId, status: 'pending' };
    } finally {
      const remaining = (this.uploadSemaphore.get(userId) ?? 1) - 1;
      if (remaining <= 0) {
        this.uploadSemaphore.delete(userId);
      } else {
        this.uploadSemaphore.set(userId, remaining);
      }
    }
  }

  async softDelete(userId: string, garmentId: string): Promise<{ success: boolean; deleted_at: Date }> {
    const result = await this.pool.query<Garment>(
      `UPDATE garments SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING deleted_at`,
      [garmentId, userId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('GARMENT_NOT_FOUND');
    }
    const deletedAt = result.rows[0].deleted_at!;
    this.wsGateway?.emitGarmentDeleted(userId, garmentId, deletedAt);
    return { success: true, deleted_at: deletedAt };
  }
}
