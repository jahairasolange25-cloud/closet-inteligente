import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { EGarmentState } from '../garment-state.enum';
import { EGarmentType } from '../garment-type.enum';

export class QueryGarmentsDto {
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
  @IsEnum(EGarmentType)
  category?: EGarmentType;

  @IsOptional()
  @IsEnum(EGarmentState)
  state?: EGarmentState;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsIn(['created_at', 'usage_count', 'last_used_at', 'name'])
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
