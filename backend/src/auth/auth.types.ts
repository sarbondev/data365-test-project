export interface JwtPayload {
  sub: string; // user id
  phone: string;
}

import { Locale } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  telegramChatId: string | null;
  locale: Locale;
}

export const AUTH_COOKIE = 'auth_token';
export const OTP_TTL_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;
