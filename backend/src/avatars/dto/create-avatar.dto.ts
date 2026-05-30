import { IsNumber, IsOptional, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CreateAvatarDto {
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  full_body_url?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  head_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(300)
  chest_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(300)
  waist_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(300)
  hips_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  inseam_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  shoulder_width_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(150)
  arm_length_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(150)
  leg_length_cm?: number;
}
