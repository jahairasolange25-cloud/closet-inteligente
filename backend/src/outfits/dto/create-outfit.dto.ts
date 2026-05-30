import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { OutfitType } from '../outfit-type.enum';

export class CreateOutfitDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEnum(OutfitType)
  @IsNotEmpty()
  type: OutfitType;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsUUID('4', { each: true })
  garment_ids: string[];
}
