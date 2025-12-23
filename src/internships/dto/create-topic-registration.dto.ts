import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTopicRegistrationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  topic_id: string;
}
