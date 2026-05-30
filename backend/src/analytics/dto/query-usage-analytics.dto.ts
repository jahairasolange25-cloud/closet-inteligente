import { IsIn, IsOptional } from 'class-validator';

export class QueryUsageAnalyticsDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d'])
  period?: string = '30d';
}
