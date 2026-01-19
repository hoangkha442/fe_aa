import { ApiPropertyOptional } from '@nestjs/swagger';
import { advisory_notes_handling_status } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';



export class UpdateAdvisoryNoteDto {
  @ApiPropertyOptional({ description: 'Nội dung ghi chú tư vấn' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Ngày tư vấn (ISO string: YYYY-MM-DD hoặc full datetime)',
    example: '2026-01-16',
  })
  @IsOptional()
  @IsString()
  counseling_date?: string;

  @ApiPropertyOptional({
    enum: advisory_notes_handling_status,
    description: 'Trạng thái xử lý ghi chú',
    example: advisory_notes_handling_status.contacted,
  })
  @IsOptional()
  @IsEnum(advisory_notes_handling_status)
  handling_status?: advisory_notes_handling_status;

  @ApiPropertyOptional({
    description: 'URL đính kèm (nếu có)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachment_url?: string;
}
