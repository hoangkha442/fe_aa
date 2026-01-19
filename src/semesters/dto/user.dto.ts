// src/admin/dto/user.dto.ts
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString() username: string;
  @IsOptional() @IsString() email?: string;
  @IsString() password_hash: string;
  @IsString() full_name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsIn(['ADMIN','ADVISOR','STUDENT','SYSTEM']) role?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsIn(['active','locked','inactive']) status?: string;
  @IsOptional() @IsIn(['ADMIN','ADVISOR','STUDENT','SYSTEM']) role?: string;
}
