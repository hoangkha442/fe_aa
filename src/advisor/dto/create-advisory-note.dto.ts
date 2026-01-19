import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAdvisoryNoteDto {
  @IsString()
  student_id!: string;

  @IsOptional()
  @IsString()
  warning_id?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsDateString()
  counseling_date?: string;

  @IsOptional()
  @IsEnum(['not_contacted', 'contacted', 'monitoring', 'stable'] as any)
  handling_status?: 'not_contacted' | 'contacted' | 'monitoring' | 'stable';

  @IsOptional()
  @IsString()
  attachment_url?: string;
}
