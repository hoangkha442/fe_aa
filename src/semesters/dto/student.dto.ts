// src/admin/dto/student.dto.ts
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateStudentDto {
  @IsString() student_code: string;
  @IsString() full_name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() class_id: string; // BigInt string
  @IsInt() @Min(2000) cohort_year: number;
  @IsOptional() @IsString() major_name?: string;
  @IsOptional() @IsIn(['studying','leave','dropout','graduated']) academic_status?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() class_id?: string;
  @IsOptional() @IsIn(['studying','leave','dropout','graduated']) academic_status?: string;
}
