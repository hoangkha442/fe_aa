import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  otp_code: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}
