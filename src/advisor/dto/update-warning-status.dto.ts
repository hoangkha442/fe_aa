import { IsEnum } from 'class-validator';

export class UpdateWarningStatusDto {
  @IsEnum(['Draft', 'Acknowledged', 'Resolved'] as any)
  status!: 'Draft' | 'Acknowledged' | 'Resolved';
}
