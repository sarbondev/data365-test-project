import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TransactionsModule,
    CategoriesModule,
    AnalyticsModule,
    AIModule,
    BotModule,
  ],
})
export class AppModule {}
