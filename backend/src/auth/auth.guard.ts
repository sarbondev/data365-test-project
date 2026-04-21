import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LocalizedException } from '../common/localized.exception';
import { AUTH_COOKIE, AuthenticatedUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = (req.cookies?.[AUTH_COOKIE] as string | undefined) ?? null;
    if (!token)
      throw new LocalizedException(
        HttpStatus.UNAUTHORIZED,
        'auth.notAuthenticated',
      );

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new LocalizedException(
        HttpStatus.UNAUTHORIZED,
        'auth.invalidSession',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        phone: true,
        telegramChatId: true,
        locale: true,
      },
    });
    if (!user)
      throw new LocalizedException(
        HttpStatus.UNAUTHORIZED,
        'auth.userNotFound',
      );

    (req as Request & { user: AuthenticatedUser }).user = user;
    return true;
  }
}
