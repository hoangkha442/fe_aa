import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @ApiProperty({ example: 'cvht01@vanlanguni.edu.vn' })  
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @ApiProperty({ example: '123456' })  
  @IsString()
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  password: string;
}
