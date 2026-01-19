import { IsArray, IsIn, ArrayMinSize } from 'class-validator';

export class BulkWarningStatusDto {
  @IsArray() @ArrayMinSize(1) ids: string[];
  @IsIn(['Draft','Sent','SendFailed','Resolved','Acknowledged'])
  status: string;
}
