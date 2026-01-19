import {
  UnauthorizedException,
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClient, users_role, users_status } from '@prisma/client';
import { JwtPayload } from 'src/types/jwt-payload.type';

import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { MailService } from 'src/common/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED = 5;
  private readonly LOCK_MINUTES = 15;
  constructor(private jwtService: JwtService, private mail: MailService ) {}
  prisma = new PrismaClient();
  async login(data: { email: string; password: string }) {
    const email = (data.email || '').trim().toLowerCase();

    const user = await this.prisma.users.findUnique({
      where: { email },
      select: {
        user_id: true,
        email: true,
        password_hash: true,
        role: true,
        status: true,
        locked_until: true,
        failed_login_count: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    if (user.status === users_status.inactive) {
      throw new ForbiddenException('Tài khoản đang bị vô hiệu hóa');
    }

    const now = new Date();
    if (user.locked_until && user.locked_until > now) {
      throw new ForbiddenException(
        'Tài khoản đang bị khóa tạm thời, vui lòng thử lại sau',
      );
    }
    const match = await bcrypt.compare(data.password, user.password_hash);

    if (!match) {
      const nextFailed = (user.failed_login_count ?? 0) + 1;

      const updateData: any = {
        failed_login_count: nextFailed,
      };

      if (nextFailed >= this.MAX_FAILED) {
        updateData.status = users_status.locked;
        updateData.locked_until = new Date(
          now.getTime() + this.LOCK_MINUTES * 60 * 1000,
        );
      }

      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: updateData,
      });

      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    await this.prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        failed_login_count: 0,
        locked_until: null,
        status: users_status.active,
        last_login_at: now,
      },
    });

    const tokens = await this.generateTokens(
      user.user_id,
      user.email!,
      user.role,
    );

    return {
      user: {
        id: user.user_id.toString(),
        role: user.role,
      },
      ...tokens,
    };
  }

  async generateTokens(id: string | bigint, email: string, role: users_role) {
    const payload: JwtPayload = {
      sub: id.toString(),
      email,
      role,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = (await this.jwtService.verifyAsync(
        refreshToken,
      )) as JwtPayload;

      return this.generateTokens(decoded.sub, decoded.email, decoded.role);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }


  private generateOtp6(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findFirst({ where: { email } });
    if (!user) {
      // tránh lộ thông tin email tồn tại hay không
      return { ok: true };
    }

    const otp = this.generateOtp6();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await this.prisma.password_reset_otps.create({
      data: {
        user_id: user.user_id,
        otp_code: otp,
        expires_at: expiresAt,
      },
    });

    await this.mail.send(
      email,
      'OTP đặt lại mật khẩu',
      `Mã OTP của bạn là: ${otp}. Hết hạn sau 10 phút.`,
    );

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.users.findFirst({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Email không tồn tại');

    const otpRow = await this.prisma.password_reset_otps.findFirst({
      where: {
        user_id: user.user_id,
        otp_code: dto.otp_code,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { otp_id: 'desc' },
    });

    if (!otpRow) throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');

    const hash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { user_id: user.user_id },
        data: { password_hash: hash },
      }),
      this.prisma.password_reset_otps.update({
        where: { otp_id: otpRow.otp_id },
        data: { used_at: new Date() },
      }),
    ]);

    return { ok: true };
  }
}
