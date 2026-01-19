import { UnauthorizedException, ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClient, users_role, users_status } from '@prisma/client';
import { JwtPayload } from 'src/types/jwt-payload.type';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED = 5;     
  private readonly LOCK_MINUTES = 15;
  constructor(
    private jwtService: JwtService  
  ) {}
  prisma = new PrismaClient()
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
      throw new ForbiddenException('Tài khoản đang bị khóa tạm thời, vui lòng thử lại sau');
    }
    const match = await bcrypt.compare(data.password, user.password_hash);

    if (!match) {
      const nextFailed = (user.failed_login_count ?? 0) + 1;

      const updateData: any = {
        failed_login_count: nextFailed,
      };

      if (nextFailed >= this.MAX_FAILED) {
        updateData.status = users_status.locked;
        updateData.locked_until = new Date(now.getTime() + this.LOCK_MINUTES * 60 * 1000);
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

    const tokens = await this.generateTokens(user.user_id, user.email!, user.role);

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
    const decoded = (await this.jwtService.verifyAsync(refreshToken)) as JwtPayload;

    return this.generateTokens(decoded.sub, decoded.email, decoded.role);
  } catch {
    throw new UnauthorizedException('Refresh token không hợp lệ');
  }
}
}
