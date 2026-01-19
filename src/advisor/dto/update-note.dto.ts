import { IsIn, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateAdvisoryNoteDto {
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsDateString() counseling_date?: string;
  @IsOptional() @IsIn(['not_contacted','contacted','monitoring','stable']) handling_status?: string;
  @IsOptional() @IsString() attachment_url?: string;
}
