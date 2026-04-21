import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from '@prisma/client';
import { AnalyticsService, Period } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: Period,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.overview(user.id, period, startDate, endDate);
  }

  @Get('by-category')
  byCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: Period,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: Type,
  ) {
    return this.service.byCategory(user.id, period, startDate, endDate, type);
  }

  @Get('trend')
  trend(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: Period,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.trend(user.id, period, startDate, endDate);
  }

  @Get('budget-status')
  budget(@CurrentUser() user: AuthenticatedUser) {
    return this.service.budgetStatus(user.id);
  }
}
