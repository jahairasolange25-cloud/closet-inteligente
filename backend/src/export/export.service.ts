import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { QueueService } from '../queue/queue.service';
import { RedisService } from '../redis/redis.service';
import { ExportRequestDto } from './dto/export-request.dto';

const EXPORT_TTL = 48 * 3600;

@Injectable()
export class ExportService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
  ) {}

  async requestExport(userId: string, dto: ExportRequestDto): Promise<{ export_id: string; status: string }> {
    const exportId = randomUUID();
    const sections = dto.sections ?? dto.include ?? ['garments', 'outfits', 'calendar', 'settings'];
    const format = dto.format ?? 'json';

    await this.redisService.set(
      `export:${exportId}`,
      JSON.stringify({
        export_id: exportId,
        user_id: userId,
        status: 'pending',
        sections,
        format,
        progress: 0,
        created_at: new Date().toISOString(),
      }),
      EXPORT_TTL,
    );

    this.queueService.addJob('export', { export_id: exportId, user_id: userId, sections, format });

    return { export_id: exportId, status: 'pending' };
  }

  async getExportStatus(exportId: string, userId: string): Promise<any> {
    const raw = await this.redisService.get<string>(`export:${exportId}`);

    if (!raw) {
      throw new NotFoundException('EXPORT_NOT_FOUND');
    }

    const data = JSON.parse(raw);

    if (data.user_id !== userId) {
      throw new NotFoundException('EXPORT_NOT_FOUND');
    }

    return {
      export_id: data.export_id,
      status: data.status,
      progress: data.progress,
      download_url: data.download_url ?? null,
      created_at: data.created_at,
      completed_at: data.completed_at ?? null,
      expires_at: data.expires_at ?? null,
    };
  }
}
