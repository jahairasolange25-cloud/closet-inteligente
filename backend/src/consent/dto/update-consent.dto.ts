import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConsentDto {
  @IsOptional()
  @IsBoolean()
  ai_processing?: boolean;

  @IsOptional()
  @IsBoolean()
  data_sharing?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing_emails?: boolean;

  @IsOptional()
  @IsBoolean()
  third_party_integrations?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  consent_version?: string;
}
