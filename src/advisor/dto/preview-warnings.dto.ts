import { IsOptional, IsString } from 'class-validator';

export class PreviewWarningsDto {
  @IsString()
  class_id!: string;

  @IsOptional()
  @IsString()
  semester_id?: string;
}
