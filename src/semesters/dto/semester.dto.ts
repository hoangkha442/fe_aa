import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSemesterDto {
  @IsString() semester_code: string;
  @IsString() name: string;
  @IsDateString() start_date: string;
  @IsDateString() end_date: string;
  @IsOptional() @IsBoolean() is_current?: boolean;
}

export class UpdateSemesterDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
  @IsOptional() @IsBoolean() is_current?: boolean;
}
