import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class SendWarningsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  warning_ids!: string[];

  @IsOptional()
  @IsEnum(['in_app', 'email'] as any)
  channel?: 'in_app' | 'email';
}
