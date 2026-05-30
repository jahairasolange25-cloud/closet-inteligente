import { IsDateString, IsOptional } from 'class-validator';

export class QueryCalendarDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
