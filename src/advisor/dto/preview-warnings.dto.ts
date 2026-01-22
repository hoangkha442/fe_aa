import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PreviewWarningsDto {
  @ApiProperty({ type: String })
  @IsString()
  class_id!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  semester_id?: string;
}
