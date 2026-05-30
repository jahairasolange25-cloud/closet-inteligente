import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { OutfitType } from '../outfit-type.enum';

export class UpdateOutfitDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsEnum(OutfitType)
  type?: OutfitType;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsUUID('4', { each: true })
  garment_ids?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  expected_version?: number;
}
