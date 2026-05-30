import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OutfitType } from '../outfit-type.enum';

export class QueryOutfitsDto {
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
  @IsEnum(OutfitType)
  type?: OutfitType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_complete?: boolean;

  @IsOptional()
  @IsIn(['created_at', 'name'])
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
