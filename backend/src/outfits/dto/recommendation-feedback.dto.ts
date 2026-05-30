import { IsArray, IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class RecommendationFeedbackDto {
  @IsOptional()
  @IsUUID('4')
  outfit_id?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  garment_ids: string[];

  @IsString()
  @IsIn(['accepted', 'rejected', 'worn', 'saved', 'dismissed'])
  action: 'accepted' | 'rejected' | 'worn' | 'saved' | 'dismissed';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_score?: number;

  @IsOptional()
  @IsString()
  session_id?: string;
}

export class RecordWearDto {
  @IsOptional()
  @IsUUID('4')
  outfit_id?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  garment_ids: string[];

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'recommendation', 'calendar', 'quick_wear'])
  source?: string;
}
