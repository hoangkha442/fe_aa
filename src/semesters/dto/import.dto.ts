// src/admin/dto/import.dto.ts
import { IsIn, IsString } from 'class-validator';

export class CreateImportBatchDto {
  @IsIn(['classes','students','grades','courses'])
  import_type: string;

  @IsString()
  file_name: string;
}
