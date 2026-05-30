import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

const ALLOWED_CROP_MODES = ['fill', 'fit', 'limit', 'crop', 'scale', 'thumb', 'pad', 'lpad', 'mfit', 'mpad'] as const;
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const;

export class TransformsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4096)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4096)
  height?: number;

  @IsOptional()
  @IsIn(ALLOWED_CROP_MODES)
  crop?: string;

  @IsOptional()
  @IsIn(ALLOWED_FORMATS)
  format?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;
}

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransformsDto)
  transforms?: TransformsDto;
}
