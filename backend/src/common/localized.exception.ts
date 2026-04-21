import { HttpException } from '@nestjs/common';

/**
 * Thrown when we want the exception filter to localize the message
 * based on the requesting user's locale (or Accept-Language / cookie).
 * The `message` field holds the i18n key, not the display text.
 */
export class LocalizedException extends HttpException {
  public readonly messageKey: string;

  constructor(status: number, messageKey: string) {
    super(messageKey, status);
    this.messageKey = messageKey;
  }
}
