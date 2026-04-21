import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.startRegistration(dto);
  }

  @Post('verify')
  @HttpCode(200)
  verify(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.verifyAndComplete(dto, res);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto, res);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    return this.auth.logout(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Patch('locale')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async updateLocale(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLocaleDto,
  ): Promise<AuthenticatedUser> {
    const updated = await this.auth.updateLocale(user.id, dto.locale);
    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      telegramChatId: updated.telegramChatId,
      locale: updated.locale,
    };
  }
}
