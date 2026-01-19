import { IsOptional, IsString } from 'class-validator';
export class StudentSnapshotsQueryDto {
  @IsOptional() @IsString() from_semester_id?: string;
  @IsOptional() @IsString() to_semester_id?: string;
}
