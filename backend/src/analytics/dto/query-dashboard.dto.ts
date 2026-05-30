import { IsIn, IsOptional } from 'class-validator';

export class QueryDashboardDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d', '1y'])
  period?: '7d' | '30d' | '90d' | '1y';
}
