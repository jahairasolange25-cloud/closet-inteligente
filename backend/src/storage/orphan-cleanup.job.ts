import { Injectable, Logger, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

const ORPHAN_MIN_AGE_HOURS = 2;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'uploads';

export interface OrphanCleanupResult {
  scanned: number;
  orphaned: number;
  deleted: number;
  errors: number;
  durationMs: number;
}

@Injectable()
export class OrphanCleanupJob {
  private readonly logger = new Logger(OrphanCleanupJob.name);
  private running = false;

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Finds Cloudinary assets that are not referenced by any garment record
   * and were uploaded more than ORPHAN_MIN_AGE_HOURS ago, then deletes them.
   *
   * This is safe to call from a cron or manually.
   */
  async run(): Promise<OrphanCleanupResult> {
    if (this.running) {
      this.logger.warn('[OrphanCleanup] Already running — skipping');
      return { scanned: 0, orphaned: 0, deleted: 0, errors: 0, durationMs: 0 };
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      this.logger.log('[OrphanCleanup] Cloudinary not configured — skipping');
      return { scanned: 0, orphaned: 0, deleted: 0, errors: 0, durationMs: 0 };
    }

    this.running = true;
    const start = Date.now();
    let scanned = 0;
    let orphaned = 0;
    let deleted = 0;
    let errors = 0;

    try {
      this.logger.log('[OrphanCleanup] Starting orphan detection scan...');

      // Load all public_ids referenced by live garments from the DB
      const { rows } = await this.pool.query<{ public_id: string }>(
        `SELECT DISTINCT
           REGEXP_REPLACE(image_url, '.*/upload/(?:v\\d+/)?', '') AS public_id
         FROM garments
         WHERE image_url IS NOT NULL
           AND deleted_at IS NULL`,
      );
      const knownPublicIds = new Set(rows.map((r) => r.public_id).filter(Boolean));

      // List Cloudinary assets in the configured folder
      const cloudinaryAssets = await this.listCloudinaryAssets(CLOUDINARY_FOLDER);
      scanned = cloudinaryAssets.length;

      const cutoffMs = Date.now() - ORPHAN_MIN_AGE_HOURS * 3600 * 1000;

      for (const asset of cloudinaryAssets) {
        if (knownPublicIds.has(asset.public_id)) continue;

        const uploadedAt = new Date(asset.created_at).getTime();
        if (uploadedAt > cutoffMs) continue;

        orphaned++;
        try {
          await new Promise<void>((resolve, reject) => {
            cloudinary.uploader.destroy(asset.public_id, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          deleted++;
          this.logger.log(`[OrphanCleanup] Deleted orphan: ${asset.public_id}`);
        } catch (err: any) {
          errors++;
          this.logger.error(`[OrphanCleanup] Failed to delete ${asset.public_id}: ${err.message}`);
        }
      }

      const result: OrphanCleanupResult = {
        scanned,
        orphaned,
        deleted,
        errors,
        durationMs: Date.now() - start,
      };

      this.logger.log(
        `[OrphanCleanup] Finished — scanned: ${scanned}, orphaned: ${orphaned}, deleted: ${deleted}, errors: ${errors}, duration: ${result.durationMs}ms`,
      );

      return result;
    } catch (err: any) {
      this.logger.error(`[OrphanCleanup] Fatal error: ${err.message}`);
      return { scanned, orphaned, deleted, errors: errors + 1, durationMs: Date.now() - start };
    } finally {
      this.running = false;
    }
  }

  private async listCloudinaryAssets(folder: string): Promise<Array<{ public_id: string; created_at: string }>> {
    const assets: Array<{ public_id: string; created_at: string }> = [];
    let nextCursor: string | undefined;

    do {
      const result: any = await new Promise((resolve, reject) => {
        cloudinary.api.resources(
          {
            type: 'upload',
            prefix: folder,
            max_results: 500,
            next_cursor: nextCursor,
          },
          (err, res) => {
            if (err) reject(err);
            else resolve(res);
          },
        );
      });

      if (result?.resources) {
        assets.push(
          ...result.resources.map((r: any) => ({
            public_id: r.public_id as string,
            created_at: r.created_at as string,
          })),
        );
      }

      nextCursor = result?.next_cursor;
    } while (nextCursor);

    return assets;
  }
}
