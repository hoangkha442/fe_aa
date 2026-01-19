import { IsArray, IsBoolean, IsInt, IsString } from 'class-validator';

export class BulkCurriculumItemDto {
  @IsString() course_id: string;
  @IsInt() semester_no: number;
  @IsBoolean() is_required: boolean;
}

export class BulkCurriculumDto {
  @IsString()
  class_id: string;

  @IsArray()
  items: BulkCurriculumItemDto[];
}
