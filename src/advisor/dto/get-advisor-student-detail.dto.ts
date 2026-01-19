import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetAdvisorStudentDetailDto {
  @IsOptional()
  @IsString()
  semester_id?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  include_grades?: boolean;
}
