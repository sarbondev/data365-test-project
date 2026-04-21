import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { OtpVerification, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../common/default-categories';
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

  /**
   * Register step 1: validate, store hashed password + OTP, return deep link.
   * The user must open the Telegram bot via the deep link to receive the code.
   */
  async startRegistration(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Bu raqam allaqachon ro‘yxatdan o‘tgan');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const code = this.generateOtpCode();
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

    // Drop any prior unverified OTPs for this phone to keep the table tidy
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

  /**
   * Register step 2: user enters the OTP delivered via Telegram.
   * Creates the user, seeds default categories, sets the cookie.
   */
  async verifyAndComplete(
    dto: VerifyOtpDto,
    res: Response,
  ): Promise<AuthenticatedUser> {
    const otp = await this.prisma.otpVerification.findUnique({
      where: { token: dto.token },
    });
    if (!otp) throw new NotFoundException('Tasdiqlash topilmadi');
    if (otp.verified) throw new BadRequestException('Allaqachon tasdiqlangan');
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Kod muddati tugagan');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Juda ko‘p urinish. Qaytadan boshlang');
    }
    if (!otp.chatId) {
      throw new BadRequestException(
        'Avval Telegram bot orqali havolani oching',
      );
    }

    if (otp.code !== dto.code) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Kod noto‘g‘ri');
    }

    // Phone is unique; if someone registered between request and verify, fail.
    const existing = await this.prisma.user.findUnique({
      where: { phone: otp.phone },
    });
    if (existing) {
      throw new ConflictException('Bu raqam allaqachon ro‘yxatdan o‘tgan');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      // chatId may already be bound to another user — guard against it.
      const chatBound = await tx.user.findUnique({
        where: { telegramChatId: otp.chatId! },
      });

      const created = await tx.user.create({
        data: {
          name: otp.name,
          phone: otp.phone,
          passwordHash: otp.passwordHash,
          telegramChatId: chatBound ? null : otp.chatId,
        },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
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
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }
    await this.setAuthCookie(res, user);
    return this.toAuthUser(user);
  }

  logout(res: Response): { ok: true } {
    res.clearCookie(AUTH_COOKIE, this.cookieBaseOptions());
    return { ok: true };
  }

  /**
   * Called by the bot when a user opens the deep link `/start verify_<token>`.
   * Returns the OTP code to send back to the user, and binds the chatId.
   * Returns null if the token is unknown / expired / already verified.
   */
  async bindChatToOtp(
    token: string,
    chatId: string,
  ): Promise<{ code: string; phone: string } | null> {
    const otp = await this.prisma.otpVerification.findUnique({
      where: { token },
    });
    if (!otp || otp.verified) return null;
    if (otp.expiresAt.getTime() < Date.now()) return null;

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { chatId },
    });
    return { code: otp.code, phone: otp.phone };
  }

  /**
   * Resend the OTP code to the bound chat (if user lost the message).
   * Returns null if the OTP isn't ready to be resent.
   */
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

  /** Used by the bot to look up which user a chat belongs to. */
  async findUserByChatId(chatId: string) {
    return this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
  }

  /** Used by the bot when a Telegram user is unknown but completed register elsewhere. */
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
}

export type { OtpVerification };
