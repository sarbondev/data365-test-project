import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Locale } from '@prisma/client';
import { DEFAULT_LOCALE, normalizeLocale, t } from './i18n';
import { LocalizedException } from './localized.exception';
import { AuthenticatedUser } from '../auth/auth.types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const locale = this.resolveLocale(request);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    if (exception instanceof LocalizedException) {
      message = t(exception.messageKey as never, locale);
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message as string) ||
            exception.message;
      if (Array.isArray(message)) message = message.join(', ');
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      data: null,
      message,
      success: false,
    });
  }

  private resolveLocale(req: Request): Locale {
    const authed = (req as Request & { user?: AuthenticatedUser }).user;
    if (authed?.locale) return authed.locale;
    const cookieLocale = (req.cookies as Record<string, string> | undefined)?.[
      'locale'
    ];
    if (cookieLocale) return normalizeLocale(cookieLocale);
    const header = req.headers['accept-language'];
    if (typeof header === 'string') return normalizeLocale(header);
    return DEFAULT_LOCALE;
  }
}
