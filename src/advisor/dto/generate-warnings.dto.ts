import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GenerateWarningsDto {
  @ApiProperty({ type: String })
  @IsString()
  class_id!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  semester_id?: string;

  @ApiProperty({ enum: ['Draft', 'Sent'], example: 'Draft' })
  @IsIn(['Draft', 'Sent'])
  create_status!: 'Draft' | 'Sent';

  @ApiPropertyOptional({ enum: ['in_app', 'email'], example: 'in_app' })
  @IsOptional()
  @IsIn(['in_app', 'email'])
  send_channel?: 'in_app' | 'email';
}
