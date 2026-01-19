import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertGradeDto {
  @IsString()
  student_id: string;

  @IsString()
  class_id: string;

  @IsString()
  semester_id: string;

  @IsString()
  course_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  attempt_no?: number;

  @IsOptional()
  score_10?: number;

  @IsOptional()
  @IsString()
  letter_grade?: string;

  @IsOptional()
  score_4?: number;

  @IsOptional()
  note?: string;
}
