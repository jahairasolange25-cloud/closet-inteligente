import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const NOTIFICATION_TYPES = [
  'pipeline_complete',
  'pipeline_failed',
  'outfit_recommended',
  'daily_reminder',
  'laundry_reminder',
  'system',
] as const;

export class QueryNotificationsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_read?: boolean;
}
