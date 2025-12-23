import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ApproveRegistrationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
