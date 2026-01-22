import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class GetAdvisorStudentDetailDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  semester_id?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  include_grades?: string; // query string

  @ApiPropertyOptional({
    example: 'false',
    description: 'Nếu true thì trả tất cả notes của SV (mọi học kỳ)',
  })
  @IsOptional()
  @IsBooleanString()
  include_notes_all?: string;
}
