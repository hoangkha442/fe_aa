import { IsOptional, IsString } from 'class-validator';
import { PageDto } from 'src/common/dto/page.dto';

export class StudentWarningsQueryDto extends PageDto {
  @IsOptional() @IsString() semester_id?: string;
  @IsOptional() @IsString() status?: string; 
}
