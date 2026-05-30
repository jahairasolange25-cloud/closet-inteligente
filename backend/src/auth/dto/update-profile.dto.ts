import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  full_name?: string;

  @IsOptional()
  @IsUrl({ require_tld: true })
  @MaxLength(2048)
  avatar_url?: string;
}
