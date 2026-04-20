import { Injectable } from '@nestjs/common';
import { Type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type Period = 'week' | 'month' | 'last-month' | 'custom';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  resolvePeriod(
    period?: Period,
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === 'week') {
      const day = now.getDay() || 7;
      start = new Date(now);
      start.setDate(now.getDate() - (day - 1));
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'last-month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    }

    const periodMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - periodMs - 1);

    return { start, end, prevStart, prevEnd };
  }

  async overview(period?: Period, startDate?: string, endDate?: string) {
    const { start, end, prevStart, prevEnd } = this.resolvePeriod(
      period,
      startDate,
      endDate,
    );

    const sumFor = async (from: Date, to: Date, type: Type) => {
      const r = await this.prisma.transaction.aggregate({
        where: { type, date: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      });
      return { total: r._sum.amount ?? 0, count: r._count };
    };

    const [income, expense, prevIncome, prevExpense] = await Promise.all([
      sumFor(start, end, 'INCOME'),
      sumFor(start, end, 'EXPENSE'),
      sumFor(prevStart, prevEnd, 'INCOME'),
      sumFor(prevStart, prevEnd, 'EXPENSE'),
    ]);

    const pct = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return ((curr - prev) / prev) * 100;
    };

    // Stats: avg daily expense, biggest single expense, most active category
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const biggestExpense = await this.prisma.transaction.findFirst({
      where: { type: 'EXPENSE', date: { gte: start, lte: end } },
      orderBy: { amount: 'desc' },
      include: { category: true },
    });

    const mostActive = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { date: { gte: start, lte: end } },
      _count: true,
      orderBy: { _count: { categoryId: 'desc' } },
      take: 1,
    });

    let mostActiveCategory: { id: string; name: string; count: number } | null =
      null;
    if (mostActive.length > 0) {
      const cat = await this.prisma.category.findUnique({
        where: { id: mostActive[0].categoryId },
      });
      if (cat) {
        mostActiveCategory = {
          id: cat.id,
          name: cat.name,
          count: mostActive[0]._count,
        };
      }
    }

    return {
      period: { start, end },
      income: {
        total: income.total,
        count: income.count,
        change: pct(income.total, prevIncome.total),
      },
      expense: {
        total: expense.total,
        count: expense.count,
        change: pct(expense.total, prevExpense.total),
      },
      net: {
        total: income.total - expense.total,
        change: pct(
          income.total - expense.total,
          prevIncome.total - prevExpense.total,
        ),
      },
      stats: {
        avgDailyExpense: expense.total / days,
        biggestExpense: biggestExpense
          ? {
              id: biggestExpense.id,
              amount: biggestExpense.amount,
              date: biggestExpense.date,
              note: biggestExpense.note,
              category: biggestExpense.category.name,
            }
          : null,
        mostActiveCategory,
      },
    };
  }

  async byCategory(
    period?: Period,
    startDate?: string,
    endDate?: string,
    type?: Type,
  ) {
    const { start, end } = this.resolvePeriod(period, startDate, endDate);

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        date: { gte: start, lte: end },
        ...(type && { type }),
      },
      _sum: { amount: true },
      _count: true,
    });

    const cats = await this.prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
    });
    const catMap = new Map(cats.map((c) => [c.id, c]));

    const items = grouped
      .map((g) => {
        const cat = catMap.get(g.categoryId);
        if (!cat) return null;
        return {
          categoryId: g.categoryId,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          type: cat.type,
          total: g._sum.amount ?? 0,
          count: g._count,
        };
      })
      .filter(
        (
          x,
        ): x is {
          categoryId: string;
          name: string;
          color: string;
          icon: string | null;
          type: Type;
          total: number;
          count: number;
        } => x !== null,
      )
      .sort((a, b) => b.total - a.total);

    return { period: { start, end }, items };
  }

  async trend(period?: Period, startDate?: string, endDate?: string) {
    const { start, end } = this.resolvePeriod(period, startDate, endDate);

    // PostgreSQL date_trunc to group by day
    const rows = await this.prisma.$queryRaw<
      Array<{ day: Date; type: Type; total: number }>
    >`
      SELECT date_trunc('day', "date") AS day,
             "type",
             SUM("amount")::float AS total
      FROM "Transaction"
      WHERE "date" >= ${start} AND "date" <= ${end}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const map = new Map<
      string,
      { date: string; income: number; expense: number }
    >();

    // Pre-fill all days
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      map.set(key, { date: key, income: 0, expense: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    for (const r of rows) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      const entry = map.get(key) ?? { date: key, income: 0, expense: 0 };
      if (r.type === 'INCOME') entry.income = Number(r.total);
      else entry.expense = Number(r.total);
      map.set(key, entry);
    }

    return {
      period: { start, end },
      points: Array.from(map.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  async budgetStatus() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const cats = await this.prisma.category.findMany({
      where: { type: 'EXPENSE', budget: { not: null, gt: 0 } },
    });

    const totals = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        type: 'EXPENSE',
        date: { gte: monthStart, lte: monthEnd },
        categoryId: { in: cats.map((c) => c.id) },
      },
      _sum: { amount: true },
    });

    const totalsMap = new Map(
      totals.map((t) => [t.categoryId, t._sum.amount ?? 0]),
    );

    return {
      period: { start: monthStart, end: monthEnd },
      items: cats.map((c) => {
        const spent = totalsMap.get(c.id) ?? 0;
        const budget = c.budget ?? 0;
        const remaining = Math.max(0, budget - spent);
        const usage = budget > 0 ? (spent / budget) * 100 : 0;
        return {
          categoryId: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          budget,
          spent,
          remaining,
          usage,
          status:
            usage >= 100
              ? 'EXCEEDED'
              : usage >= 80
                ? 'WARNING'
                : 'OK',
        };
      }),
    };
  }
}
