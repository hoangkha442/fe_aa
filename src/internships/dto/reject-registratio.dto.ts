import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectRegistrationDto {
  @ApiProperty({ example: "Không đủ điều kiện hoặc số lượng đã đầy" })
  @IsString()
  reason: string;
}
