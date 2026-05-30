import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SemanticSearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  query: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclude_ids?: string[];
}

export class SimilaritySearchDto {
  @IsString()
  garment_id: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class DuplicateCheckDto {
  @IsString()
  garment_id: string;

  @IsOptional()
  threshold?: number;
}
