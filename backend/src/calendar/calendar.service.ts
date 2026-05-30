import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';
import { QueryCalendarRangeDto } from './dto/query-calendar-range.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

interface CalendarEventRow {
  id: string;
  user_id: string;
  outfit_id: string | null;
  event_date: string;
  title: string | null;
  notes: string | null;
  is_worn: boolean;
  created_at: Date;
  updated_at: Date;
}

interface OutfitSummary {
  id: string;
  name: string;
  type: string;
  is_complete: boolean;
}

@Injectable()
export class CalendarService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async create(userId: string, dto: CreateCalendarDto): Promise<any> {
    if (dto.outfit_id) {
      const outfitResult = await this.pool.query(
        `SELECT id FROM outfits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [dto.outfit_id, userId],
      );
      if (!outfitResult.rows[0]) {
        throw new BadRequestException('OUTFIT_NOT_FOUND');
      }
    }

    try {
      const result = await this.pool.query<CalendarEventRow>(
        `INSERT INTO calendar_events (user_id, outfit_id, event_date, title, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          dto.outfit_id ?? null,
          dto.event_date,
          dto.title ?? null,
          dto.notes ?? null,
        ],
      );
      return result.rows[0];
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException('CALENDAR_EVENT_ALREADY_EXISTS');
      }
      throw err;
    }
  }

  async getRange(userId: string, query: QueryCalendarRangeDto): Promise<any> {
    const startDate = new Date(query.start_date);
    const endDate = new Date(query.end_date);

    if (startDate > endDate) {
      throw new BadRequestException('START_DATE_AFTER_END_DATE');
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays > 365) {
      throw new BadRequestException('DATE_RANGE_TOO_LARGE');
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const [scheduledResult, outfitFreqResult, mostUsedResult, newOutfitsResult] = await Promise.all([
      this.pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT event_date) FROM calendar_events WHERE user_id = $1 AND event_date BETWEEN $2 AND $3`,
        [userId, startStr, endStr],
      ),
      this.pool.query<{ outfit_id: string; cnt: string }>(
        `SELECT outfit_id, COUNT(*)::text AS cnt FROM calendar_events WHERE user_id = $1 AND event_date BETWEEN $2 AND $3 AND outfit_id IS NOT NULL GROUP BY outfit_id ORDER BY cnt DESC`,
        [userId, startStr, endStr],
      ),
      this.pool.query<{ outfit_id: string; name: string; cnt: string }>(
        `SELECT ce.outfit_id, o.name, COUNT(*)::text AS cnt
         FROM calendar_events ce
         JOIN outfits o ON o.id = ce.outfit_id
         WHERE ce.user_id = $1 AND ce.event_date BETWEEN $2 AND $3 AND ce.outfit_id IS NOT NULL
         GROUP BY ce.outfit_id, o.name ORDER BY cnt DESC LIMIT 1`,
        [userId, startStr, endStr],
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM outfits WHERE user_id = $1 AND created_at::date BETWEEN $2::date AND $3::date AND deleted_at IS NULL`,
        [userId, startStr, endStr],
      ),
    ]);

    const outfitFrequency: Record<string, number> = {};
    for (const row of outfitFreqResult.rows) {
      outfitFrequency[row.outfit_id] = parseInt(row.cnt, 10);
    }

    const mostUsed = mostUsedResult.rows[0]
      ? {
          outfit_id: mostUsedResult.rows[0].outfit_id,
          outfit_name: mostUsedResult.rows[0].name,
          times_used: parseInt(mostUsedResult.rows[0].cnt, 10),
        }
      : null;

    return {
      total_days: totalDays,
      scheduled_days: parseInt(scheduledResult.rows[0]?.count ?? '0', 10),
      outfit_frequency: outfitFrequency,
      most_used_outfit: mostUsed,
      new_outfits_added: parseInt(newOutfitsResult.rows[0]?.count ?? '0', 10),
    };
  }

  async findAll(userId: string, query: QueryCalendarDto): Promise<any> {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 7);

    const startDate = query.start_date
      ? new Date(query.start_date)
      : defaultStart;

    const endDate = query.end_date
      ? new Date(query.end_date)
      : now;

    if (startDate > endDate) {
      throw new BadRequestException('START_DATE_AFTER_END_DATE');
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      throw new BadRequestException('DATE_RANGE_TOO_LARGE');
    }

    const eventsResult = await this.pool.query<CalendarEventRow>(
      `SELECT * FROM calendar_events
       WHERE user_id = $1 AND event_date BETWEEN $2 AND $3
       ORDER BY event_date ASC, created_at ASC`,
      [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    );

    const events = eventsResult.rows;

    const outfitIds = events
      .map((e) => e.outfit_id)
      .filter((id): id is string => id !== null);

    const outfitMap = new Map<string, OutfitSummary>();

    if (outfitIds.length > 0) {
      const outfitsResult = await this.pool.query<OutfitSummary>(
        `SELECT id, name, type, is_complete FROM outfits WHERE id = ANY($1::uuid[])`,
        [outfitIds],
      );
      for (const o of outfitsResult.rows) {
        outfitMap.set(o.id, o);
      }
    }

    const grouped: Record<string, any[]> = {};

    for (const event of events) {
      const dateKey = event.event_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      let outfit = null;
      if (event.outfit_id) {
        const found = outfitMap.get(event.outfit_id);
        if (found) {
          outfit = found;
        }
      }

      grouped[dateKey].push({
        id: event.id,
        outfit_id: event.outfit_id,
        event_date: event.event_date,
        title: event.title,
        notes: event.notes,
        is_worn: event.is_worn,
        outfit,
        created_at: event.created_at,
        updated_at: event.updated_at,
      });
    }

    const total = events.length;

    return {
      data: grouped,
      meta: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        total,
      },
    };
  }

  async update(userId: string, eventId: string, dto: UpdateCalendarDto): Promise<any> {
    const eventResult = await this.pool.query<CalendarEventRow>(
      `SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2`,
      [eventId, userId],
    );

    if (!eventResult.rows[0]) {
      throw new NotFoundException('EVENT_NOT_FOUND');
    }

    const existing = eventResult.rows[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const effectiveDate = dto.event_date ?? existing.event_date;

    if (effectiveDate < todayStr) {
      throw new BadRequestException('CANNOT_MODIFY_PAST_EVENT');
    }

    if (dto.outfit_id !== undefined && dto.outfit_id !== null) {
      const outfitResult = await this.pool.query(
        `SELECT id FROM outfits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [dto.outfit_id, userId],
      );
      if (!outfitResult.rows[0]) {
        throw new BadRequestException('OUTFIT_NOT_FOUND');
      }
    }

    const sets: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.outfit_id !== undefined) {
      params.push(dto.outfit_id ?? null);
      sets.push(`outfit_id = $${paramIndex++}`);
    }

    if (dto.title !== undefined) {
      params.push(dto.title);
      sets.push(`title = $${paramIndex++}`);
    }

    if (dto.notes !== undefined) {
      params.push(dto.notes);
      sets.push(`notes = $${paramIndex++}`);
    }

    if (dto.is_worn !== undefined) {
      params.push(dto.is_worn);
      sets.push(`is_worn = $${paramIndex++}`);
    }

    if (dto.event_date !== undefined) {
      params.push(dto.event_date);
      sets.push(`event_date = $${paramIndex++}`);
    }

    if (sets.length > 0) {
      params.push(eventId);
      const result = await this.pool.query<CalendarEventRow>(
        `UPDATE calendar_events SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params,
      );
      return result.rows[0];
    }

    return existing;
  }
}
