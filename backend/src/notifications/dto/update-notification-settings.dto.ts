import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  push_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pipeline_complete?: boolean;

  @IsOptional()
  @IsBoolean()
  pipeline_failed?: boolean;

  @IsOptional()
  @IsBoolean()
  outfit_recommended?: boolean;

  @IsOptional()
  @IsBoolean()
  daily_reminder?: boolean;

  @IsOptional()
  @IsBoolean()
  laundry_reminder?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  quiet_hours_start?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  quiet_hours_end?: string;
}
