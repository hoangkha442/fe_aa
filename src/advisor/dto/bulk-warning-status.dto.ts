import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';

export class BulkWarningStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ enum: ['Draft', 'Sent', 'SendFailed', 'Resolved', 'Acknowledged'] })
  @IsIn(['Draft', 'Sent', 'SendFailed', 'Resolved', 'Acknowledged'])
  status!: 'Draft' | 'Sent' | 'SendFailed' | 'Resolved' | 'Acknowledged';
}
