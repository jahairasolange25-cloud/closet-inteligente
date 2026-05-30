import { ArrayMinSize, IsArray, IsIn, IsOptional } from 'class-validator';

export class ExportRequestDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['garments', 'outfits', 'calendar', 'settings', 'avatars', 'analytics'], { each: true })
  sections?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['garments', 'outfits', 'calendar', 'settings', 'avatars', 'analytics'], { each: true })
  include?: string[];

  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: string = 'json';
}
