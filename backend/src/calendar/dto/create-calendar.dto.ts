import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCalendarDto {
  @IsDateString()
  event_date: string;

  @IsOptional()
  @IsUUID()
  outfit_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
