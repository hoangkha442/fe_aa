import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';

export class SendWarningsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  warning_ids!: string[];

  @ApiProperty({ enum: ['in_app', 'email'], example: 'in_app' })
  @IsIn(['in_app', 'email'])
  channel!: 'in_app' | 'email';
}
