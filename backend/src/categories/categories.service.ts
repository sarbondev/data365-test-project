import { HttpStatus, Injectable } from '@nestjs/common';
import { Type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LocalizedException } from '../common/localized.exception';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, type?: Type) {
    const cats = await this.prisma.category.findMany({
      where: { userId, ...(type && { type }) },
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { transactions: true } },
      },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTotals = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: monthStart } },
      _sum: { amount: true },
    });

    const totalsMap = new Map(
      monthlyTotals.map((t) => [t.categoryId, t._sum.amount ?? 0]),
    );

    return cats.map((c) => ({
      ...c,
      transactionCount: c._count.transactions,
      monthlyTotal: totalsMap.get(c.id) ?? 0,
    }));
  }

  async findById(userId: string, id: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id, userId },
      include: { _count: { select: { transactions: true } } },
    });
    if (!cat)
      throw new LocalizedException(HttpStatus.NOT_FOUND, 'categories.notFound');
    return cat;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: {
        userId_name_type: { userId, name: dto.name, type: dto.type },
      },
    });
    if (existing) {
      throw new LocalizedException(
        HttpStatus.CONFLICT,
        'categories.alreadyExists',
      );
    }
    return this.prisma.category.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const cat = await this.findById(userId, id);
    if (dto.name && dto.name !== cat.name) {
      const dup = await this.prisma.category.findUnique({
        where: {
          userId_name_type: { userId, name: dto.name, type: cat.type },
        },
      });
      if (dup) {
        throw new LocalizedException(
          HttpStatus.CONFLICT,
          'categories.alreadyExists',
        );
      }
    }
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async delete(userId: string, id: string) {
    const cat = await this.findById(userId, id);
    if (cat.isDefault) {
      throw new LocalizedException(
        HttpStatus.BAD_REQUEST,
        'categories.cannotDeleteDefault',
      );
    }
    if (cat._count.transactions > 0) {
      throw new LocalizedException(
        HttpStatus.BAD_REQUEST,
        'categories.cannotDeleteWithTx',
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { id };
  }
}
