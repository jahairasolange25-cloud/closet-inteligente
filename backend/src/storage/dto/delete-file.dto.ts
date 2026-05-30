import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public_id: string;
}
