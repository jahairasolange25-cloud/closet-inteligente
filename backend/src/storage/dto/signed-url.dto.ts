import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const SIGNED_URL_PRESETS = ['thumbnail', 'preview', 'full'] as const;
export type SignedUrlPreset = typeof SIGNED_URL_PRESETS[number];

export class SignedUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public_id: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  expires_in?: number = 3600;

  @IsOptional()
  @IsIn(SIGNED_URL_PRESETS)
  preset?: SignedUrlPreset;
}
