import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class AssignAdvisorDto {
  @IsString() advisor_user_id: string;
  @IsDateString() from_date: string;
  @IsOptional() @IsDateString() to_date?: string;
  @IsOptional() @IsBoolean() is_primary?: boolean = true;
}

export class EndAssignmentDto {
  @IsDateString() to_date: string;
}
