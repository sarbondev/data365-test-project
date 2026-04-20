import { Controller, Get, Query } from '@nestjs/common';
import { Type } from '@prisma/client';
import { AnalyticsService, Period } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  overview(
    @Query('period') period?: Period,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.overview(period, startDate, endDate);
  }

  @Get('by-category')
  byCategory(
    @Query('period') period?: Period,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: Type,
  ) {
    return this.service.byCategory(period, startDate, endDate, type);
  }

  @Get('trend')
  trend(
    @Query('period') period?: Period,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.trend(period, startDate, endDate);
  }

  @Get('budget-status')
  budget() {
    return this.service.budgetStatus();
  }
}
