import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { CategoriesModule } from '../categories/categories.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [TransactionsModule, CategoriesModule, AnalyticsModule, AIModule],
  providers: [BotService],
})
export class BotModule {}
