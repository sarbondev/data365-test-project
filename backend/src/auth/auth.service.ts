import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { Locale, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultCategories } from '../common/default-categories';
import { LocalizedException } from '../common/localized.exception';
import { DEFAULT_LOCALE } from '../common/i18n';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AUTH_COOKIE, AuthenticatedUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, res: Response): Promise<AuthenticatedUser> {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new LocalizedException(
        HttpStatus.CONFLICT,
        'auth.phoneAlreadyRegistered',
      );
    }

    const locale: Locale = dto.locale ?? DEFAULT_LOCALE;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          passwordHash,
          locale,
        },
      });

      await tx.category.createMany({
        data: defaultCategories.map((c) => ({
          ...c,
          isDefault: true,
          userId: created.id,
        })),
      });

      return created;
    });

    await this.setAuthCookie(res, user);
    return this.toAuthUser(user);
  }

  async login(dto: LoginDto, res: Response): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) {
      throw new LocalizedException(
        HttpStatus.UNAUTHORIZED,
        'auth.invalidCredentials',
      );
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new LocalizedException(
        HttpStatus.UNAUTHORIZED,
        'auth.invalidCredentials',
      );
    }
    await this.setAuthCookie(res, user);
    return this.toAuthUser(user);
  }

  logout(res: Response): { ok: true } {
    res.clearCookie(AUTH_COOKIE, this.cookieBaseOptions());
    return { ok: true };
  }

  async findUserByChatId(chatId: string) {
    return this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
  }

  async updateLocale(userId: string, locale: Locale): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
  }

  private toAuthUser(u: User): AuthenticatedUser {
    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      telegramChatId: u.telegramChatId,
      locale: u.locale,
    };
  }

  private async setAuthCookie(res: Response, user: User): Promise<void> {
    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    const token = await this.jwt.signAsync(payload);
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieBaseOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieBaseOptions() {
    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure,
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }
}
