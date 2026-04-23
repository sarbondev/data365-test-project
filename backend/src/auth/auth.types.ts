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
