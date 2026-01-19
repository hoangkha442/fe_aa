// src/admin/dto/warning-rule.dto.ts
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWarningRuleDto {
  @IsString() rule_code: string;
  @IsString() rule_name: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['GPA_SEM','GPA_CUM','FAIL_COUNT','CREDITS_EARNED','CREDITS_FAILED'])
  condition_type: string;
  @IsIn(['LT','LTE','GT','GTE','EQ','NEQ'])
  operator: string;
  @IsNumber() threshold_value: number;
  @IsOptional() level?: number;
  @IsOptional() @IsBoolean() is_active?: boolean = true;
}

export class UpdateWarningRuleDto {
  @IsOptional() @IsString() rule_name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['LT','LTE','GT','GTE','EQ','NEQ']) operator?: string;
  @IsOptional() threshold_value?: number;
  @IsOptional() level?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
