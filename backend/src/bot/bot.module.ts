import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [TransactionsModule, AnalyticsModule, AIModule],
  providers: [BotService],
  controllers: [BotController],
})
export class BotModule {}
