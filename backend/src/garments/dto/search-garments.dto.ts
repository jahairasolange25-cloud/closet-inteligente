import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { EGarmentState } from '../garment-state.enum';
import { EGarmentType } from '../garment-type.enum';

export class SearchGarmentsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q: string;

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
}
