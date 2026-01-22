import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class GetAdvisorDashboardDto {
  @ApiProperty({ type: String })
  @IsString()
  class_id!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  semester_id?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  page?: any;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  limit?: any;

  @IsOptional()
  @IsBooleanString()
  warned_only?: string; // "true"/"false"
}
