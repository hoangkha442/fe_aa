import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateWarningStatusDto {
  @ApiProperty({ enum: ['Draft', 'Sent', 'SendFailed', 'Resolved', 'Acknowledged'] })
  @IsIn(['Draft', 'Sent', 'SendFailed', 'Resolved', 'Acknowledged'])
  status!: 'Draft' | 'Sent' | 'SendFailed' | 'Resolved' | 'Acknowledged';
}
