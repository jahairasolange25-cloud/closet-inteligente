import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';

interface AvatarRow {
  id: string;
  user_id: string;
  full_body_url: string | null;
  head_url: string | null;
  height_cm: string | null;
  chest_cm: string | null;
  waist_cm: string | null;
  hips_cm: string | null;
  inseam_cm: string | null;
  shoulder_width_cm: string | null;
  arm_length_cm: string | null;
  leg_length_cm: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'] as const;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

@Injectable()
export class AvatarsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {}

  async create(userId: string, dto: CreateAvatarDto): Promise<any> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const existingResult = await client.query<AvatarRow>(
        `SELECT * FROM avatars WHERE user_id = $1 AND is_active = true AND deleted_at IS NULL`,
        [userId],
      );

      const existing = existingResult.rows[0];

      if (existing) {
        const versionCountResult = await client.query<{ count: string }>(
          `SELECT COUNT(*) FROM avatar_versions WHERE avatar_id = $1`,
          [existing.id],
        );
        const versionCount = parseInt(versionCountResult.rows[0].count, 10);

        await client.query(
          `INSERT INTO avatar_versions (avatar_id, version_number, full_body_url, head_url, changes_description)
           VALUES ($1, $2, $3, $4, 'Auto-saved before deactivation')`,
          [existing.id, versionCount + 1, existing.full_body_url, existing.head_url],
        );

        if (versionCount >= 3) {
          await client.query(
            `DELETE FROM avatar_versions WHERE id IN (
               SELECT id FROM avatar_versions WHERE avatar_id = $1 ORDER BY version_number ASC LIMIT 1
             )`,
            [existing.id],
          );
        }

        await client.query(
          `UPDATE avatars SET is_active = false WHERE id = $1`,
          [existing.id],
        );
      }

      const round = (val: number | undefined): number | null =>
        val !== undefined ? Math.round(val * 10) / 10 : null;

      const result = await client.query<AvatarRow>(
        `INSERT INTO avatars (user_id, full_body_url, head_url, height_cm, chest_cm, waist_cm, hips_cm, inseam_cm, shoulder_width_cm, arm_length_cm, leg_length_cm, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
         RETURNING *`,
        [
          userId,
          dto.full_body_url ?? null,
          dto.head_url ?? null,
          round(dto.height_cm),
          round(dto.chest_cm),
          round(dto.waist_cm),
          round(dto.hips_cm),
          round(dto.inseam_cm),
          round(dto.shoulder_width_cm),
          round(dto.arm_length_cm),
          round(dto.leg_length_cm),
        ],
      );

      await client.query('COMMIT');

      const avatar = result.rows[0];
      return {
        id: avatar.id,
        user_id: avatar.user_id,
        full_body_url: avatar.full_body_url,
        head_url: avatar.head_url,
        height_cm: avatar.height_cm ? parseFloat(avatar.height_cm) : null,
        chest_cm: avatar.chest_cm ? parseFloat(avatar.chest_cm) : null,
        waist_cm: avatar.waist_cm ? parseFloat(avatar.waist_cm) : null,
        hips_cm: avatar.hips_cm ? parseFloat(avatar.hips_cm) : null,
        inseam_cm: avatar.inseam_cm ? parseFloat(avatar.inseam_cm) : null,
        shoulder_width_cm: avatar.shoulder_width_cm ? parseFloat(avatar.shoulder_width_cm) : null,
        arm_length_cm: avatar.arm_length_cm ? parseFloat(avatar.arm_length_cm) : null,
        leg_length_cm: avatar.leg_length_cm ? parseFloat(avatar.leg_length_cm) : null,
        is_active: avatar.is_active,
        created_at: avatar.created_at,
        updated_at: avatar.updated_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async generate(userId: string, avatarId: string, file: Express.Multer.File): Promise<{ generation_id: string; status: string }> {
    const avatarResult = await this.pool.query<AvatarRow>(
      `SELECT * FROM avatars WHERE id = $1 AND user_id = $2 AND is_active = true AND deleted_at IS NULL`,
      [avatarId, userId],
    );

    if (!avatarResult.rows[0]) {
      throw new NotFoundException('AVATAR_NOT_FOUND');
    }

    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }

    if (!(ALLOWED_VIDEO_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException('INVALID_VIDEO_TYPE');
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException('VIDEO_TOO_LARGE');
    }

    const generationId = randomUUID();

    const { temp_url, file_hash } = await this.storageService.uploadTemp(file);

    await this.redisService.set(
      `generation:${generationId}`,
      JSON.stringify({
        generation_id: generationId,
        avatar_id: avatarId,
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

    return { generation_id: generationId, status: 'pending' };
  }
}
