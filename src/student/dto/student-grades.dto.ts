import { IsOptional, IsString } from 'class-validator';
export class StudentGradesQueryDto {
  @IsOptional() @IsString() semester_id?: string;
}
