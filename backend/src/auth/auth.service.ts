import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { Locale, OtpVerification, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultCategoriesFor } from '../common/default-categories';
import { LocalizedException } from '../common/localized.exception';
import { DEFAULT_LOCALE } from '../common/i18n';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  AUTH_COOKIE,
  AuthenticatedUser,
  JwtPayload,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MIN,
} from './auth.types';

export interface RegisterResult {
  token: string;
  telegramDeepLink: string;
  expiresAt: Date;
  phone: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async startRegistration(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new LocalizedException(
        HttpStatus.CONFLICT,
        'auth.phoneAlreadyRegistered',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const code = this.generateOtpCode();
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
    const locale: Locale = dto.locale ?? DEFAULT_LOCALE;

    await this.prisma.otpVerification.deleteMany({
      where: { phone: dto.phone, verified: false },
    });

    await this.prisma.otpVerification.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        passwordHash,
        code,
        token,
        locale,
        expiresAt,
      },
    });

    return {
      token,
      telegramDeepLink: this.buildDeepLink(token),
      expiresAt,
      phone: dto.phone,
    };
  }

  async verifyAndComplete(
    dto: VerifyOtpDto,
    res: Response,
  ): Promise<AuthenticatedUser> {
    const otp = await this.prisma.otpVerification.findUnique({
      where: { token: dto.token },
    });
    if (!otp)
      throw new LocalizedException(
        HttpStatus.NOT_FOUND,
        'auth.verificationNotFound',
      );
    if (otp.verified)
      throw new LocalizedException(
        HttpStatus.BAD_REQUEST,
        'auth.alreadyVerified',
      );
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new LocalizedException(
        HttpStatus.BAD_REQUEST,
        'auth.codeExpired',
      );
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new LocalizedException(
        HttpStatus.BAD_REQUEST,
        'auth.tooManyAttempts',
      );
    }
    if (!otp.chatId) {
      throw new LocalizedException(
        HttpStatus.BAD_REQUEST,
        'auth.openLinkFirst',
      );
    }

    if (otp.code !== dto.code) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new LocalizedException(
        HttpStatus.UNAUTHORIZED,
        'auth.codeIncorrect',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: otp.phone },
    });
    if (existing) {
      throw new LocalizedException(
        HttpStatus.CONFLICT,
        'auth.phoneAlreadyRegistered',
      );
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const chatBound = await tx.user.findUnique({
        where: { telegramChatId: otp.chatId! },
      });

      const created = await tx.user.create({
        data: {
          name: otp.name,
          phone: otp.phone,
          passwordHash: otp.passwordHash,
          locale: otp.locale,
          telegramChatId: chatBound ? null : otp.chatId,
        },
      });

      await tx.category.createMany({
        data: defaultCategoriesFor(otp.locale).map((c) => ({
          ...c,
          isDefault: true,
          userId: created.id,
        })),
      });

      await tx.otpVerification.update({
        where: { id: otp.id },
        data: { verified: true },
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

  async bindChatToOtp(
    token: string,
    chatId: string,
  ): Promise<{ code: string; phone: string; locale: Locale } | null> {
    const otp = await this.prisma.otpVerification.findUnique({
      where: { token },
    });
    if (!otp || otp.verified) return null;
    if (otp.expiresAt.getTime() < Date.now()) return null;

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { chatId },
    });
    return { code: otp.code, phone: otp.phone, locale: otp.locale };
  }

  async resendOtp(
    token: string,
  ): Promise<{ chatId: string; code: string; phone: string } | null> {
    const otp = await this.prisma.otpVerification.findUnique({
      where: { token },
    });
    if (!otp || otp.verified || !otp.chatId) return null;
    if (otp.expiresAt.getTime() < Date.now()) return null;
    return { chatId: otp.chatId, code: otp.code, phone: otp.phone };
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
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure,
      path: '/',
    };
  }

  private generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private buildDeepLink(token: string): string {
    const username = this.config.get<string>('TELEGRAM_BOT_USERNAME', '');
    return username
      ? `https://t.me/${username}?start=verify_${token}`
      : `tg://resolve?domain=&start=verify_${token}`;
  }

  async findUserByChatId(chatId: string) {
    return this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
  }

  async bindChatToExistingUser(
    userId: string,
    chatId: string,
  ): Promise<User | null> {
    const existing = await this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
    if (existing && existing.id !== userId) return null;
    return this.prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: chatId },
    });
  }

  async updateLocale(userId: string, locale: Locale): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
  }
}

export type { OtpVerification };
