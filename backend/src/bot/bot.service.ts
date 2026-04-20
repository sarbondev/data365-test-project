import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import axios from 'axios';
import { Category, Source, Type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoriesService } from '../categories/categories.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AIService } from '../ai/ai.service';
import { ParsedIntent } from '../ai/ai.types';
import { BOT_MESSAGES, CALLBACK } from './bot.constants';
import {
  budgetExceededMessage,
  budgetWarningMessage,
  categoryPickerMessage,
  formatAmount,
  formatUzDate,
  txConfirmationMessage,
} from './bot.format';

interface PendingTx {
  type: Type;
  amount: number;
  note?: string;
  date?: Date;
  chatId: number;
}

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf | null = null;
  private readonly pending = new Map<number, PendingTx>();
  private lastChatId: number | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly txService: TransactionsService,
    private readonly catService: CategoriesService,
    private readonly analyticsService: AnalyticsService,
    private readonly aiService: AIService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not set — bot disabled. Set it in .env to enable.',
      );
      return;
    }

    this.bot = new Telegraf(token);
    this.registerHandlers(this.bot);

    this.bot
      .launch({ dropPendingUpdates: true })
      .catch((e) => this.logger.error('Bot launch failed', e as Error));
    this.logger.log('🤖 Telegram bot started (polling)');
  }

  async onModuleDestroy() {
    this.bot?.stop('SIGTERM');
  }

  private registerHandlers(bot: Telegraf) {
    bot.start((ctx) => ctx.reply(BOT_MESSAGES.WELCOME));
    bot.command('cancel', (ctx) => {
      this.pending.delete(ctx.chat.id);
      return ctx.reply(BOT_MESSAGES.CANCELLED);
    });

    bot.on(message('text'), async (ctx) => {
      this.lastChatId = ctx.chat.id;
      try {
        await this.handleText(ctx, ctx.message.text);
      } catch (e) {
        this.logger.error('Text handler failed', e as Error);
        await ctx.reply(BOT_MESSAGES.GENERIC_ERROR);
      }
    });

    bot.on(message('voice'), async (ctx) => {
      this.lastChatId = ctx.chat.id;
      const processing = await ctx.reply(BOT_MESSAGES.PROCESSING);
      try {
        const fileId = ctx.message.voice.file_id;
        const link = await ctx.telegram.getFileLink(fileId);
        const audioRes = await axios.get<ArrayBuffer>(link.toString(), {
          responseType: 'arraybuffer',
        });
        const buf = Buffer.from(audioRes.data);
        const text = await this.aiService.transcribeVoice(buf);
        await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id);
        await ctx.reply(`🎙 "${text}"`);
        await this.handleText(ctx, text);
      } catch (e) {
        this.logger.error('Voice handler failed', e as Error);
        await ctx.reply(BOT_MESSAGES.GENERIC_ERROR);
      }
    });

    bot.action(new RegExp(`^${CALLBACK.PICK_CATEGORY}:(.+)$`), async (ctx) => {
      const categoryId = ctx.match[1];
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const pending = this.pending.get(chatId);
      if (!pending) {
        await ctx.answerCbQuery('Tranzaksiya topilmadi');
        return;
      }
      await ctx.answerCbQuery();
      try {
        const tx = await this.txService.create({
          type: pending.type,
          amount: pending.amount,
          categoryId,
          note: pending.note,
          date: pending.date?.toISOString(),
          source: Source.TELEGRAM,
        });
        this.pending.delete(chatId);
        if (ctx.callbackQuery.message) {
          await ctx.editMessageText(txConfirmationMessage(tx), {
            reply_markup: this.txActionsKeyboard(tx.id).reply_markup,
          });
        }
        await this.checkBudget(chatId, tx.categoryId);
      } catch (e) {
        this.logger.error('Save from pick failed', e as Error);
        await ctx.reply(BOT_MESSAGES.GENERIC_ERROR);
      }
    });

    bot.action(new RegExp(`^${CALLBACK.DELETE_TX}:(.+)$`), async (ctx) => {
      const txId = ctx.match[1];
      try {
        await this.txService.delete(txId);
        await ctx.answerCbQuery("O'chirildi");
        if (ctx.callbackQuery.message) {
          await ctx.editMessageText("🗑 Tranzaksiya o'chirildi");
        }
      } catch {
        await ctx.answerCbQuery("O'chirib bo'lmadi");
      }
    });

    bot.action(new RegExp(`^${CALLBACK.EDIT_TX}:(.+)$`), async (ctx) => {
      const url = this.config.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      await ctx.answerCbQuery();
      await ctx.reply(
        `✏️ Tahrirlash uchun web-dashboardga o'ting:\n${url}/transactions`,
      );
    });

    bot.action(CALLBACK.CANCEL, async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) this.pending.delete(chatId);
      await ctx.answerCbQuery('Bekor qilindi');
      if (ctx.callbackQuery.message) {
        await ctx.editMessageText(BOT_MESSAGES.CANCELLED);
      }
    });
  }

  private txActionsKeyboard(txId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✏️ Tahrirlash', `${CALLBACK.EDIT_TX}:${txId}`),
        Markup.button.callback("🗑 O'chirish", `${CALLBACK.DELETE_TX}:${txId}`),
      ],
    ]);
  }

  private async categoryPickerKeyboard(type: Type) {
    const cats = await this.prisma.category.findMany({
      where: { type },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    const buttons = cats.map((c) =>
      Markup.button.callback(
        `${c.icon ?? ''} ${c.name}`.trim(),
        `${CALLBACK.PICK_CATEGORY}:${c.id}`,
      ),
    );
    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < buttons.length; i += 2) {
      rows.push(buttons.slice(i, i + 2));
    }
    rows.push([Markup.button.callback("❌ Bekor qilish", CALLBACK.CANCEL)]);
    return Markup.inlineKeyboard(rows);
  }

  private async handleText(ctx: Context, text: string) {
    if (!ctx.chat) return;
    const cats = await this.prisma.category.findMany({
      select: { name: true, type: true },
    });

    const intent = await this.aiService.parseIntent(text, cats);
    this.logger.debug(`Intent: ${JSON.stringify(intent)}`);

    if (intent.action === 'DELETE_LAST') {
      await this.handleDeleteLast(ctx);
      return;
    }

    if (intent.action === 'QUERY') {
      await this.handleQuery(ctx, intent);
      return;
    }

    if (intent.action === 'UNCLEAR') {
      await ctx.reply(
        intent.clarificationQuestion ??
          "❓ Tushunmadim. Masalan yozing: \"Bugun ijaraga 3 mln so'm\"",
      );
      return;
    }

    // LOG_INCOME or LOG_EXPENSE
    if (intent.clarificationNeeded || !intent.amount || intent.amount <= 0) {
      await ctx.reply(
        intent.clarificationQuestion ?? BOT_MESSAGES.AMOUNT_REQUIRED,
      );
      return;
    }

    const type: Type =
      intent.action === 'LOG_INCOME' ? 'INCOME' : 'EXPENSE';
    const date = intent.date ? new Date(intent.date) : new Date();

    // Find category
    let category: Category | null = null;
    if (intent.categoryGuess) {
      category = await this.prisma.category.findFirst({
        where: {
          type,
          name: { equals: intent.categoryGuess, mode: 'insensitive' },
        },
      });
    }

    if (!category) {
      // Stash pending and ask user to pick
      this.pending.set(ctx.chat.id, {
        type,
        amount: intent.amount,
        note: intent.note,
        date,
        chatId: ctx.chat.id,
      });
      const kb = await this.categoryPickerKeyboard(type);
      await ctx.reply(categoryPickerMessage(type), kb);
      return;
    }

    // Save directly
    const tx = await this.txService.create({
      type,
      amount: intent.amount,
      categoryId: category.id,
      note: intent.note,
      date: date.toISOString(),
      source: Source.TELEGRAM,
    });

    await ctx.reply(
      txConfirmationMessage(tx),
      this.txActionsKeyboard(tx.id),
    );

    await this.checkBudget(ctx.chat.id, category.id);
  }

  private async handleDeleteLast(ctx: Context) {
    try {
      const last = await this.txService.deleteLast(Source.TELEGRAM);
      await ctx.reply(
        `🗑 So'nggi tranzaksiya o'chirildi:\n${formatAmount(last.amount)} so'm — ${last.category.name}`,
      );
    } catch {
      await ctx.reply(BOT_MESSAGES.NO_LAST_TX);
    }
  }

  private async handleQuery(ctx: Context, intent: ParsedIntent) {
    const period =
      intent.queryType === 'THIS_WEEK'
        ? 'week'
        : intent.queryType === 'LAST_MONTH'
          ? 'last-month'
          : 'month';

    let category: Category | null = null;
    if (intent.queryCategory || intent.categoryGuess) {
      const name = intent.queryCategory ?? intent.categoryGuess;
      if (name) {
        category = await this.prisma.category.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } },
        });
      }
    }

    if (category) {
      const { start, end } = this.analyticsService.resolvePeriod(period);
      const txs = await this.prisma.transaction.findMany({
        where: { categoryId: category.id, date: { gte: start, lte: end } },
        orderBy: { amount: 'desc' },
      });
      const total = txs.reduce((s, t) => s + t.amount, 0);
      const top = txs.slice(0, 3);
      const periodLabel =
        period === 'week'
          ? 'Shu hafta'
          : period === 'last-month'
            ? "O'tgan oy"
            : `${formatUzDate(start).split(' ').slice(1).join(' ')}`;

      const lines = [
        `📊 ${category.name} — ${periodLabel}`,
        '',
        `${category.type === 'INCOME' ? '💰' : '💸'} Jami: ${formatAmount(total)} so'm`,
        `📝 ${txs.length} ta tranzaksiya`,
      ];
      if (top.length > 0) {
        lines.push('', 'Top:');
        for (const t of top) {
          const d = new Date(t.date);
          const dStr = `${d.getDate()} ${['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'][d.getMonth()]}`;
          lines.push(`• ${dStr} — ${formatAmount(t.amount)} so'm`);
        }
      }
      await ctx.reply(lines.join('\n'));
      return;
    }

    // Generic period summary
    const overview = await this.analyticsService.overview(period);
    const periodLabel =
      period === 'week'
        ? 'Shu hafta'
        : period === 'last-month'
          ? "O'tgan oy"
          : 'Bu oy';
    await ctx.reply(
      [
        `📊 ${periodLabel} bo'yicha hisobot`,
        '',
        `💰 Kirim: ${formatAmount(overview.income.total)} so'm`,
        `💸 Xarajat: ${formatAmount(overview.expense.total)} so'm`,
        `📈 Sof: ${formatAmount(overview.net.total)} so'm`,
      ].join('\n'),
    );
  }

  private async checkBudget(chatId: number, categoryId: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!cat || !cat.budget || cat.budget <= 0 || cat.type !== 'EXPENSE')
      return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const agg = await this.prisma.transaction.aggregate({
      where: {
        categoryId,
        type: 'EXPENSE',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });
    const spent = agg._sum.amount ?? 0;
    const usage = (spent / cat.budget) * 100;

    if (!this.bot) return;

    if (usage >= 100) {
      await this.bot.telegram.sendMessage(
        chatId,
        budgetExceededMessage(cat, cat.budget),
      );
    } else if (usage >= 80) {
      await this.bot.telegram.sendMessage(
        chatId,
        budgetWarningMessage(cat, spent, cat.budget),
      );
    }
  }
}
