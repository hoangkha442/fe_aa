import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveRegistrationDto {
  @ApiProperty({ required: false, example: "Chấp thuận vì sinh viên đạt yêu cầu" })
  @IsOptional()
  @IsString()
  note?: string;
}
