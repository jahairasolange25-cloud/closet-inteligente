import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { CascadeService } from '../ai/cascade.service';
import { DATABASE_POOL } from '../database/database.module';
import { WebSocketGatewayImpl } from '../websocket/websocket.gateway';
import { AIPipelineAdapter, AI_PIPELINE_ADAPTER } from './ai-pipeline.adapter';
import { HttpAIPipelineAdapter } from './http-ai-pipeline.adapter';
import { QueueService } from '../queue/queue.service';
import { RedisService } from '../redis/redis.service';

const PIPELINE_STEPS = [
  'background_removal',
  'classification',
  'attribute_extraction',
  'thumbnail',
] as const;

const UPLOAD_TTL_SECONDS = 86400;

interface PipelineStep {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface PipelineStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  garment_id: string;
  user_id: string;
  image_url: string;
  steps: Record<string, PipelineStep>;
  error?: string;
  created_at: string;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(AI_PIPELINE_ADAPTER) private readonly aiAdapter: AIPipelineAdapter,
    @Optional() private readonly cascadeService?: CascadeService,
    @Optional() private readonly wsGateway?: WebSocketGatewayImpl,
  ) {
    this.queueService.processJobs('pipeline', async (job) => {
      await this.processPipeline(job.data.uploadId);
    });
  }

  async startPipeline(
    uploadId: string,
    garmentId: string,
    userId: string,
    imageUrl: string,
    force = false,
  ): Promise<{ started: boolean; reason?: string }> {
    // Idempotency: check if a pipeline is already active for this garment
    const existingUploadId = await this.redisService.get<string>(`pipeline:garment:${garmentId}`);
    if (existingUploadId && !force) {
      const existingData = await this.redisService.get<string>(`pipeline:${existingUploadId}`);
      if (existingData) {
        const existing: PipelineStatus = JSON.parse(existingData);
        if (existing.status === 'pending' || existing.status === 'processing') {
          this.logger.warn(
            `[Pipeline] Skipping duplicate job for garment ${garmentId} (uploadId=${existingUploadId}, status=${existing.status})`,
          );
          return { started: false, reason: 'PIPELINE_ALREADY_ACTIVE' };
        }
      }
    }

    const idempotencyKey = `pipeline:idem:${garmentId}`;
    const alreadyLocked = await this.redisService.get<string>(idempotencyKey);
    if (alreadyLocked && alreadyLocked === uploadId && !force) {
      return { started: false, reason: 'DUPLICATE_JOB_ID' };
    }

    const status: PipelineStatus = {
      status: 'pending',
      garment_id: garmentId,
      user_id: userId,
      image_url: imageUrl,
      steps: {},
      created_at: new Date().toISOString(),
    };

    for (const step of PIPELINE_STEPS) {
      status.steps[step] = { status: 'pending' };
    }

    await this.redisService.set(`pipeline:${uploadId}`, JSON.stringify(status), UPLOAD_TTL_SECONDS);
    await this.redisService.set(`pipeline:garment:${garmentId}`, uploadId, UPLOAD_TTL_SECONDS);
    await this.redisService.set(idempotencyKey, uploadId, UPLOAD_TTL_SECONDS);

    this.queueService.addJob('pipeline', { uploadId });

    this.logger.log(`[Pipeline] Started pipeline for garment ${garmentId} (uploadId=${uploadId})`);
    return { started: true };
  }

  async cancelPipeline(garmentId: string): Promise<{ cancelled: boolean; reason?: string }> {
    const uploadId = await this.redisService.get<string>(`pipeline:garment:${garmentId}`);
    if (!uploadId) {
      return { cancelled: false, reason: 'NO_ACTIVE_PIPELINE' };
    }

    const data = await this.redisService.get<string>(`pipeline:${uploadId}`);
    if (!data) {
      return { cancelled: false, reason: 'PIPELINE_NOT_FOUND' };
    }

    const status: PipelineStatus = JSON.parse(data);
    if (status.status === 'completed' || status.status === 'failed') {
      return { cancelled: false, reason: `PIPELINE_ALREADY_${status.status.toUpperCase()}` };
    }

    status.status = 'failed';
    status.error = 'Cancelled by user request';
    await this.saveStatus(uploadId, status);
    await this.updatePipelineStatusInDb(garmentId, 'cancelled');

    this.logger.log(`[Pipeline] Cancelled pipeline for garment ${garmentId} (uploadId=${uploadId})`);
    return { cancelled: true };
  }

  async getPipelineStatus(garmentId: string): Promise<{ status: string; progress: number; steps: any[]; created_at: string | null; updated_at: string | null } | null> {
    const uploadId = await this.redisService.get(`pipeline:garment:${garmentId}`);

    if (!uploadId) {
      const garment = await this.pool.query(
        `SELECT image_url FROM garments WHERE id = $1 AND deleted_at IS NULL`,
        [garmentId],
      );
      if (garment.rows[0]?.image_url) {
        return {
          status: 'completed',
          progress: 100,
          steps: PIPELINE_STEPS.map((name) => ({
            name,
            status: 'completed',
            started_at: null,
            completed_at: null,
          })),
          created_at: null,
          updated_at: null,
        };
      }
      return {
        status: 'not_started',
        progress: 0,
        steps: PIPELINE_STEPS.map((name) => ({
          name,
          status: 'pending',
          started_at: null,
          completed_at: null,
        })),
        created_at: null,
        updated_at: null,
      };
    }

    const data = await this.redisService.get<string>(`pipeline:${uploadId}`);
    if (!data) {
      return {
        status: 'completed',
        progress: 100,
        steps: PIPELINE_STEPS.map((name) => ({
          name,
          status: 'completed',
          started_at: null,
          completed_at: null,
        })),
        created_at: null,
        updated_at: null,
      };
    }

    const status: PipelineStatus = JSON.parse(data);
    const total = PIPELINE_STEPS.length;
    const completed = PIPELINE_STEPS.filter((s) => status.steps[s]?.status === 'completed').length;
    const progress = Math.round((completed / total) * 100);

    return {
      status: status.status,
      progress,
      steps: PIPELINE_STEPS.map((name) => ({
        name,
        status: status.steps[name]?.status ?? 'pending',
        started_at: status.steps[name]?.started_at ?? null,
        completed_at: status.steps[name]?.completed_at ?? null,
        error: status.steps[name]?.error,
      })),
      created_at: status.created_at,
      updated_at: new Date().toISOString(),
    };
  }

  private async processPipeline(uploadId: string): Promise<void> {
    const statusData = await this.redisService.get<string>(`pipeline:${uploadId}`);
    if (!statusData) return;

    const status: PipelineStatus = JSON.parse(statusData);
    if (status.status === 'processing') return;

    status.status = 'processing';
    await this.saveStatus(uploadId, status);

    try {
      if (this.aiAdapter instanceof HttpAIPipelineAdapter) {
        await this.processWithFullPipeline(uploadId, status);
      } else {
        await this.processStepByStep(uploadId, status);
      }
    } catch (error: any) {
      status.status = 'failed';
      status.error = error.message || 'Pipeline failed';
      await this.saveStatus(uploadId, status);
      await this.updatePipelineStatusInDb(status.garment_id, 'failed');
      this.logger.error(`[Pipeline:${uploadId}] Failed: ${status.error}`);
    }
  }

  private async processWithFullPipeline(
    uploadId: string,
    status: PipelineStatus,
  ): Promise<void> {
    const adapter = this.aiAdapter as HttpAIPipelineAdapter;

    const result = await adapter.runFullPipeline(
      status.garment_id,
      status.image_url,
      status.user_id,
    );

    for (const step of result.steps) {
      if (status.steps[step.step]) {
        status.steps[step.step].status = step.status as any;
        status.steps[step.step].started_at = step.started_at;
        status.steps[step.step].completed_at = step.completed_at || undefined;
        status.steps[step.step].error = step.error || undefined;
      }
    }

    if (result.status === 'failed') {
      status.status = 'failed';
      status.error = result.error || 'Pipeline failed at AI service';
      await this.saveStatus(uploadId, status);
      await this.updatePipelineStatusInDb(status.garment_id, 'failed');
      return;
    }

    status.status = 'completed';
    await this.saveStatus(uploadId, status);

    await this.persistPipelineResults(
      status.garment_id,
      result,
    );

    this.logger.log(
      `[Pipeline:${uploadId}] Full pipeline completed in ${result.total_processing_ms}ms`,
    );

    await this.postPipelineEnrichment(status.garment_id, status.user_id);
  }

  private async processStepByStep(
    uploadId: string,
    status: PipelineStatus,
  ): Promise<void> {
    for (const stepName of PIPELINE_STEPS) {
      const step = status.steps[stepName];
      step.status = 'processing';
      step.started_at = new Date().toISOString();
      await this.saveStatus(uploadId, status);

      try {
        await this.aiAdapter.processStep(stepName, status.garment_id, status.image_url);
        step.status = 'completed';
        step.completed_at = new Date().toISOString();
        this.logger.log(`[Pipeline:${uploadId}] Step "${stepName}" completed`);
      } catch (error: any) {
        step.status = 'failed';
        step.completed_at = new Date().toISOString();
        step.error = error.message || 'Unknown error';
        status.status = 'failed';
        status.error = `Step ${stepName} failed: ${step.error}`;
        await this.saveStatus(uploadId, status);
        await this.updatePipelineStatusInDb(status.garment_id, 'failed');
        this.logger.error(`[Pipeline:${uploadId}] Step "${stepName}" failed: ${step.error}`);
        return;
      }

      await this.saveStatus(uploadId, status);
    }

    status.status = 'completed';
    await this.saveStatus(uploadId, status);
    this.logger.log(`[Pipeline:${uploadId}] All steps completed for garment ${status.garment_id}`);

    await this.updateGarmentImages(status.garment_id, status.image_url);
    await this.updatePipelineStatusInDb(status.garment_id, 'completed');
    await this.postPipelineEnrichment(status.garment_id, status.user_id);
  }

  private async persistPipelineResults(
    garmentId: string,
    result: any,
  ): Promise<void> {
    let classification: string | null = null;
    let confidence = 0.0;
    let dominantColors: any[] = [];
    let dominantColorsHex: string[] = [];
    let processedImageUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let durationMs = 0;

    for (const step of result.steps) {
      if (step.result) {
        if (step.result.classification) {
          classification = step.result.classification.category || null;
          confidence = step.result.classification.confidence || 0;
        }
        if (step.result.dominant_colors) {
          dominantColors = step.result.dominant_colors;
          dominantColorsHex = step.result.dominant_colors.map(
            (c: any) => c.hex,
          );
        }
        if (step.result.masked_image_url) {
          processedImageUrl = step.result.masked_image_url;
        }
        if (step.result.thumbnail_url) {
          thumbnailUrl = step.result.thumbnail_url;
        }
        if (step.result.preview_url && !thumbnailUrl) {
          thumbnailUrl = step.result.preview_url;
        }
      }
    }

    durationMs = result.total_processing_ms || 0;

    await this.pool.query(
      `UPDATE garments SET
        pipeline_status = 'completed',
        processed_image_url = COALESCE($1, processed_image_url),
        dominant_colors = $2::jsonb,
        dominant_colors_hex = $3,
        ai_classification = $4,
        ai_confidence = $5,
        ai_processing_duration_ms = $6,
        thumbnail_url = COALESCE($7, thumbnail_url),
        updated_at = NOW()
      WHERE id = $8 AND deleted_at IS NULL`,
      [
        processedImageUrl,
        JSON.stringify(dominantColors),
        dominantColorsHex,
        classification,
        confidence,
        durationMs,
        thumbnailUrl,
        garmentId,
      ],
    );

    this.logger.log(
      `[Pipeline] Persisted results for garment ${garmentId}: ` +
      `class=${classification}, confidence=${confidence}, ` +
      `colors=${dominantColorsHex.length}, duration=${durationMs}ms`,
    );
  }

  private async saveStatus(uploadId: string, status: PipelineStatus): Promise<void> {
    await this.redisService.set(
      `pipeline:${uploadId}`,
      JSON.stringify(status),
      UPLOAD_TTL_SECONDS,
    );
  }

  private buildThumbnailUrl(imageUrl: string): string {
    if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
      return imageUrl.replace('/upload/', '/upload/w_200,h_200,c_fill,f_webp,q_80/');
    }
    return imageUrl;
  }

  private async updateGarmentImages(garmentId: string, imageUrl: string): Promise<void> {
    const thumbnailUrl = this.buildThumbnailUrl(imageUrl);

    await this.pool.query(
      `UPDATE garments SET image_url = $1, thumbnail_url = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`,
      [imageUrl, thumbnailUrl, garmentId],
    );
  }

  private async postPipelineEnrichment(garmentId: string, userId: string): Promise<void> {
    if (!this.cascadeService && !this.wsGateway) return;

    const garmentRow = await this.pool.query(
      `SELECT ai_classification, dominant_colors_hex, image_url, thumbnail_url, tags, notes FROM garments WHERE id = $1 AND deleted_at IS NULL`,
      [garmentId],
    );
    const g = garmentRow.rows[0];
    if (!g) return;

    const category: string = g.ai_classification ?? '';
    const colors: string[] = g.dominant_colors_hex ?? [];

    let notes: string | null = g.notes;
    let tags: string[] = g.tags ?? [];

    if (category && this.cascadeService) {
      const describeResult = await this.cascadeService.describeGarment({ garmentId, category, colors });
      if (describeResult.source !== 'unavailable' && describeResult.text) {
        notes = describeResult.text;

        const tagsResult = await this.cascadeService.generateStyleTags({ garmentId, description: describeResult.text, colors });
        if (tagsResult.source !== 'unavailable' && tagsResult.tags.length > 0) {
          tags = tagsResult.tags;
        }

        await this.pool.query(
          `UPDATE garments SET notes = $1, tags = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`,
          [notes, tags, garmentId],
        );

        this.logger.log(`[Pipeline] AI enrichment complete for garment ${garmentId}: source=${describeResult.source}, tags=${tags.length}`);
      }
    }

    if (userId) {
      this.wsGateway?.emitGarmentPipelineComplete(userId, garmentId, {
        imageUrl: g.image_url,
        thumbnailUrl: g.thumbnail_url,
        tags,
        notes,
      });
    }
  }

  private async updatePipelineStatusInDb(
    garmentId: string,
    status: string,
  ): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE garments SET pipeline_status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
        [status, garmentId],
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not update pipeline status in DB for garment ${garmentId}: ${err.message}`,
      );
    }
  }
}
