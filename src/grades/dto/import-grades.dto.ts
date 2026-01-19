 import { IsOptional, IsString } from 'class-validator';

export class ImportGradesDto {
  @IsString()
  import_type: 'grades';

  @IsOptional()
  @IsString()
  overwrite?: string;
}
