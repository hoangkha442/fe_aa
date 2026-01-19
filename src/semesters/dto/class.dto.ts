// src/admin/dto/class.dto.ts
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateClassDto {
  @IsString() class_code: string;
  @IsString() class_name: string;
  @IsOptional() @IsString() major_name?: string;
  @IsInt() @Min(2000) cohort_year: number;
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
}

export class UpdateClassDto {
  @IsOptional() @IsString() class_name?: string;
  @IsOptional() @IsString() major_name?: string;
  @IsOptional() @IsInt() @Min(2000) cohort_year?: number;
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
}
