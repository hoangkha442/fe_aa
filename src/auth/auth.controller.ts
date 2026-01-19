import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
// import { CreateAuthDto } from 'src/auth/dto/create-auth.dto';
import { ForgotPasswordDto } from 'src/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto)
  }

  @Post('refresh')
  refresh(@Body('refresh_token') token: string) {
    return this.authService.refreshToken(token)
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
