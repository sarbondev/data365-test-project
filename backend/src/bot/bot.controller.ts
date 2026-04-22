import { Controller, Post, Body, Param, HttpCode } from '@nestjs/common';
import { BotService } from './bot.service';
import { Update } from 'telegraf/typings/core/types/typegram';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('webhook/:secret')
  @HttpCode(200)
  async handleUpdate(
    @Param('secret') secret: string,
    @Body() update: Update,
  ): Promise<void> {
    await this.botService.handleWebhookUpdate(secret, update);
  }
}
