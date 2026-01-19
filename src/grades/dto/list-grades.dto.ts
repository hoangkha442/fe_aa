import { IsOptional, IsString } from 'class-validator';

export class ListGradesDto {
  @IsString()
  class_id: string;

  @IsOptional()
  @IsString()
  semester_id?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
