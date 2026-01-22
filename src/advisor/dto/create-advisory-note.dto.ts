import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdvisoryNoteDto {
  @ApiProperty({ type: String })
  @IsString()
  student_id!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  warning_id?: string;

  @ApiProperty({ type: String })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ type: String, example: '2026-01-13' })
  @IsOptional()
  @IsString()
  counseling_date?: string;

  @ApiPropertyOptional({
    enum: ['not_contacted', 'contacted', 'monitoring', 'stable'],
    example: 'contacted',
  })
  @IsOptional()
  @IsIn(['not_contacted', 'contacted', 'monitoring', 'stable'])
  handling_status?: 'not_contacted' | 'contacted' | 'monitoring' | 'stable';

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachment_url?: string;
}
