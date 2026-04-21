export interface JwtPayload {
  sub: string; // user id
  phone: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  telegramChatId: string | null;
}

export const AUTH_COOKIE = 'auth_token';
export const OTP_TTL_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;
