import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface PreferencesRow {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  pipeline_complete: boolean;
  pipeline_failed: boolean;
  outfit_recommended: boolean;
  daily_reminder: boolean;
  laundry_reminder: boolean;
  system: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unread_count: number;
  };
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async findAll(userId: string, query: QueryNotificationsDto): Promise<PaginatedResult<any>> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (query.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(query.type);
    }

    if (query.is_read !== undefined) {
      conditions.push(`is_read = $${paramIndex++}`);
      params.push(query.is_read);
    }

    const whereClause = conditions.join(' AND ');

    const unreadResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    const unreadCount = parseInt(unreadResult.rows[0].count, 10);

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const limit = Math.min(query.limit ?? 20, 100);
    const skip = ((query.page ?? 1) - 1) * limit;

    const dataResult = await this.pool.query<NotificationRow>(
      `SELECT id, type, title, body, data, is_read, read_at, created_at
       FROM notifications WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, skip],
    );

    const page = query.page ?? 1;
    return {
      data: dataResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
        unread_count: unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<any> {
    const result = await this.pool.query<NotificationRow>(
      `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, body, data, is_read, read_at, created_at`,
      [notificationId, userId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('NOTIFICATION_NOT_FOUND');
    }

    return result.rows[0];
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; affected_count: number }> {
    const result = await this.pool.query(
      `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId],
    );

    return { success: true, affected_count: result.rowCount ?? 0 };
  }

  async getSettings(userId: string): Promise<PreferencesRow> {
    const result = await this.pool.query<PreferencesRow>(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId],
    );

    if (result.rows[0]) {
      return result.rows[0];
    }

    const created = await this.pool.query<PreferencesRow>(
      `INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *`,
      [userId],
    );

    return created.rows[0];
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingsDto): Promise<PreferencesRow> {
    await this.getSettings(userId);

    if ((dto.quiet_hours_start && !dto.quiet_hours_end) || (!dto.quiet_hours_start && dto.quiet_hours_end)) {
      throw new BadRequestException('QUIET_HOURS_INCOMPLETE');
    }

    const sets: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields: (keyof UpdateNotificationSettingsDto)[] = [
      'push_enabled', 'email_enabled', 'in_app_enabled',
      'pipeline_complete', 'pipeline_failed', 'outfit_recommended',
      'daily_reminder', 'laundry_reminder', 'system',
    ];

    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        params.push((dto as any)[field]);
        sets.push(`${field} = $${paramIndex++}`);
      }
    }

    if (dto.quiet_hours_start !== undefined) {
      params.push(dto.quiet_hours_start);
      sets.push(`quiet_hours_start = $${paramIndex++}`);
    }

    if (dto.quiet_hours_end !== undefined) {
      params.push(dto.quiet_hours_end);
      sets.push(`quiet_hours_end = $${paramIndex++}`);
    }

    if (sets.length === 0) {
      return this.getSettings(userId);
    }

    params.push(userId);
    const result = await this.pool.query<PreferencesRow>(
      `UPDATE notification_preferences SET ${sets.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      params,
    );

    return result.rows[0];
  }
}
