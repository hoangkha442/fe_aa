import { IsOptional, IsString } from 'class-validator';

export class GetAdvisorDashboardDto {
  @IsString()
  class_id!: string;

  @IsOptional()
  @IsString()
  semester_id?: string;

  @IsOptional()
  @IsString()
  q?: string; // search theo student_code / name

  @IsOptional()
  page?: any;

  @IsOptional()
  limit?: any;
}
