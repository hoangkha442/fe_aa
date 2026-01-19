// src/admin/dto/course.dto.ts
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString() course_code: string;
  @IsString() course_name: string;
  @IsInt() @Min(1) credits: number;
  @IsOptional() @IsIn(['required', 'elective']) course_type?: 'required' | 'elective';
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() course_name?: string;
  @IsOptional() @IsInt() @Min(1) credits?: number;
  @IsOptional() @IsIn(['required', 'elective']) course_type?: 'required' | 'elective';
  @IsOptional() @IsBoolean() is_active?: boolean;
}
