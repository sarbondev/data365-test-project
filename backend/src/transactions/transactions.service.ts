import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Source, Type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListTransactionsDto) {
    const where: Prisma.TransactionWhereInput = { userId };
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    if (query.search) {
      where.OR = [
        { note: { contains: query.search, mode: 'insensitive' } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.type !== dto.type) {
      throw new BadRequestException(
        `Category type (${category.type}) does not match transaction type (${dto.type})`,
      );
    }

    return this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amount: dto.amount,
        categoryId: dto.categoryId,
        note: dto.note,
        date: dto.date ? new Date(dto.date) : new Date(),
        source: dto.source ?? Source.DASHBOARD,
      },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findById(userId, id);

    if (dto.amount !== undefined && dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.date && { date: new Date(dto.date) }),
      },
      include: { category: true },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
    return { id };
  }

  async deleteLast(userId: string, source?: Source) {
    const where: Prisma.TransactionWhereInput = source
      ? { userId, source }
      : { userId };
    const last = await this.prisma.transaction.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    if (!last) throw new NotFoundException('No transactions to delete');
    await this.prisma.transaction.delete({ where: { id: last.id } });
    return last;
  }

  async summary(userId: string, startDate?: string, endDate?: string) {
    const now = new Date();
    const monthStart =
      startDate
        ? new Date(startDate)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = endDate ? new Date(endDate) : now;

    const periodMs = monthEnd.getTime() - monthStart.getTime();
    const prevStart = new Date(monthStart.getTime() - periodMs);
    const prevEnd = monthStart;

    const sumFor = async (from: Date, to: Date, type: Type) => {
      const res = await this.prisma.transaction.aggregate({
        where: { userId, type, date: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      });
      return {
        total: res._sum.amount ?? 0,
        count: res._count,
      };
    };

    const [income, expense, prevIncome, prevExpense] = await Promise.all([
      sumFor(monthStart, monthEnd, 'INCOME'),
      sumFor(monthStart, monthEnd, 'EXPENSE'),
      sumFor(prevStart, prevEnd, 'INCOME'),
      sumFor(prevStart, prevEnd, 'EXPENSE'),
    ]);

    const pct = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return ((curr - prev) / prev) * 100;
    };

    return {
      period: { start: monthStart, end: monthEnd },
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
      previous: {
        income: prevIncome.total,
        expense: prevExpense.total,
        net: prevIncome.total - prevExpense.total,
      },
    };
  }
}
