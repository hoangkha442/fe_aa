import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdvisoryNoteDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: String, example: '2026-01-13' })
  @IsOptional()
  @IsString()
  counseling_date?: string;

  @ApiPropertyOptional({
    enum: ['not_contacted', 'contacted', 'monitoring', 'stable'],
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
