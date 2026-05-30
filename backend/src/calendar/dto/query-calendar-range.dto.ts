import { IsDateString } from 'class-validator';

export class QueryCalendarRangeDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
