// src/student/dto/progress-summary.dto.ts
import { IsString } from 'class-validator';
export class ProgressSummaryQueryDto {
  @IsString() semester_id: string;
}
