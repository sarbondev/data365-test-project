import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(type?: Type) {
    const cats = await this.prisma.category.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { transactions: true } },
      },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTotals = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { date: { gte: monthStart } },
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

  async findById(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name_type: { name: dto.name, type: dto.type } },
    });
    if (existing) {
      throw new ConflictException(
        `Category "${dto.name}" already exists for ${dto.type}`,
      );
    }
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.findById(id);
    if (dto.name && dto.name !== cat.name) {
      const dup = await this.prisma.category.findUnique({
        where: { name_type: { name: dto.name, type: cat.type } },
      });
      if (dup) {
        throw new ConflictException(
          `Category "${dto.name}" already exists for ${cat.type}`,
        );
      }
    }
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const cat = await this.findById(id);
    if (cat.isDefault) {
      throw new BadRequestException(
        'Default categories cannot be deleted',
      );
    }
    if (cat._count.transactions > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${cat._count.transactions} transaction(s)`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { id };
  }
}
