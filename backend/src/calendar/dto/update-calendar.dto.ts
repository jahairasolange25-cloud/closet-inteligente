import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCalendarDto {
  @IsOptional()
  @IsUUID()
  outfit_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_worn?: boolean;

  @IsOptional()
  @IsDateString()
  event_date?: string;
}
