import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { OutfitType } from '../outfit-type.enum';

export class RecommendOutfitDto {
  @IsOptional()
  @IsEnum(OutfitType)
  type?: OutfitType;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;

  @IsOptional()
  @IsInt()
  temperature?: number;

  @IsOptional()
  @IsBoolean()
  prefer_recently_worn?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  exclude_garment_ids?: string[];
}
