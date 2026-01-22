import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional } from 'class-validator';

export class GetAdvisorClassesDto {
  @ApiPropertyOptional({ example: 'true', description: 'Include inactive assignments' })
  @IsOptional()
  @IsBooleanString()
  include_inactive?: string;
}
