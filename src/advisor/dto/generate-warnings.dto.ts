import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GenerateWarningsDto {
  @IsString()
  class_id!: string;

  @IsOptional()
  @IsString()
  semester_id?: string;

  @IsEnum(['Draft', 'Sent'] as any)
  create_status!: 'Draft' | 'Sent';

  @IsOptional()
  @IsEnum(['in_app', 'email'] as any)
  send_channel?: 'in_app' | 'email';
}
