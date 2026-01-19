import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetAdvisorClassesDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  include_inactive?: boolean;
}
