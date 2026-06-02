import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { QueueService } from '../queue/queue.service';
import { RedisService } from '../redis/redis.service';
import { WebSocketGatewayImpl } from '../websocket/websocket.gateway';

const AVATAR_GENERATION_QUEUE = 'avatar-generation';
const RPM_API_BASE = 'https://api.readyplayer.me/v2';
const RPM_DEMO_AVATAR_URL = 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb';

interface GenerationData {
  generation_id: string;
  avatar_id: string;
  user_id: string;
  status: string;
  temp_url: string;
  [key: string]: unknown;
}

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
}

@Injectable()
export class AvatarGenerationService implements OnModuleInit {
  private readonly logger = new Logger(AvatarGenerationService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly wsGateway: WebSocketGatewayImpl,
    private readonly redisService: RedisService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  onModuleInit(): void {
    this.queueService.processJobs(AVATAR_GENERATION_QUEUE, async (job) => {
      await this.processAvatarGeneration(
        job.data as { generationId: string; avatarId: string; userId: string },
      );
    });
    this.logger.log('Avatar generation worker registered');
  }

  async enqueueGeneration(generationId: string, avatarId: string, userId: string): Promise<void> {
    await this.queueService.addJob(
      AVATAR_GENERATION_QUEUE,
      { generationId, avatarId, userId },
      { attempts: 2 },
    );
  }

  private async getGenerationData(generationId: string): Promise<GenerationData | null> {
    const raw = await this.redisService.get<unknown>(`generation:${generationId}`);
    if (!raw) return null;
    // avatars.service.ts pre-stringifies the value before passing to redisService.set(),
    // which itself JSON.stringify()s it again — so we get back a JSON string, not an object.
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as GenerationData; } catch { return null; }
    }
    return raw as GenerationData;
  }

  private async processAvatarGeneration(data: {
    generationId: string;
    avatarId: string;
    userId: string;
  }): Promise<void> {
    const { generationId, avatarId, userId } = data;
    this.logger.log(`Processing avatar generation ${generationId}`);

    const genData = await this.getGenerationData(generationId);
    if (!genData) {
      this.logger.error(`Generation data not found in Redis for ${generationId}`);
      this.wsGateway.emitAvatarFailed(userId, generationId, 'GENERATION_DATA_NOT_FOUND');
      return;
    }

    await this.redisService.set(
      `generation:${generationId}`,
      { ...genData, status: 'generating' },
      86400,
    );

    try {
      const avatarResult = await this.pool.query<AvatarRow>(
        `SELECT * FROM avatars WHERE id = $1 AND user_id = $2 AND is_active = true AND deleted_at IS NULL`,
        [avatarId, userId],
      );
      const avatarRow = avatarResult.rows[0];
      if (!avatarRow) throw new Error('AVATAR_NOT_FOUND');

      const { fullBodyUrl } = await this.generateAvatarModel(avatarRow);

      const updated = await this.pool.query<AvatarRow>(
        `UPDATE avatars SET full_body_url = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [fullBodyUrl, avatarId, userId],
      );

      await this.redisService.set(
        `generation:${generationId}`,
        { ...genData, status: 'completed', full_body_url: fullBodyUrl },
        86400,
      );

      this.wsGateway.emitAvatarGenerated(userId, this.formatAvatar(updated.rows[0]));
      this.logger.log(`Avatar generation ${generationId} completed`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      this.logger.error(`Avatar generation ${generationId} failed: ${message}`);
      await this.redisService.set(
        `generation:${generationId}`,
        { ...genData, status: 'failed', error: message },
        86400,
      );
      this.wsGateway.emitAvatarFailed(userId, generationId, message);
      throw error;
    }
  }

  private async generateAvatarModel(_avatarRow: AvatarRow): Promise<{ fullBodyUrl: string }> {
    const subdomain = process.env.READY_PLAYER_ME_SUBDOMAIN;
    const apiKey = process.env.READY_PLAYER_ME_API_KEY;

    if (!subdomain || !apiKey) {
      this.logger.warn('READY_PLAYER_ME credentials not set — using demo avatar GLB');
      return { fullBodyUrl: RPM_DEMO_AVATAR_URL };
    }

    const response = await fetch(`${RPM_API_BASE}/avatars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ data: { partner: subdomain, bodyType: 'fullbody' } }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RPM API error ${response.status}: ${text}`);
    }

    const json = await response.json() as { data?: { id?: string } };
    const rpmAvatarId = json?.data?.id;
    if (!rpmAvatarId) throw new Error('RPM API did not return an avatar ID');

    return { fullBodyUrl: `https://models.readyplayer.me/${rpmAvatarId}.glb` };
  }

  private formatAvatar(row: AvatarRow) {
    return {
      id: row.id,
      user_id: row.user_id,
      full_body_url: row.full_body_url,
      head_url: row.head_url,
      height_cm: row.height_cm ? parseFloat(row.height_cm) : null,
      chest_cm: row.chest_cm ? parseFloat(row.chest_cm) : null,
      waist_cm: row.waist_cm ? parseFloat(row.waist_cm) : null,
      hips_cm: row.hips_cm ? parseFloat(row.hips_cm) : null,
      inseam_cm: row.inseam_cm ? parseFloat(row.inseam_cm) : null,
      shoulder_width_cm: row.shoulder_width_cm ? parseFloat(row.shoulder_width_cm) : null,
      arm_length_cm: row.arm_length_cm ? parseFloat(row.arm_length_cm) : null,
      leg_length_cm: row.leg_length_cm ? parseFloat(row.leg_length_cm) : null,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
