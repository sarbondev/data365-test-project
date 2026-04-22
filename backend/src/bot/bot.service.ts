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
import { Category, Locale, Source, Type, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AIService } from '../ai/ai.service';
import { AuthService } from '../auth/auth.service';
import { ParsedIntent } from '../ai/ai.types';
import { botMessages, CALLBACK } from './bot.constants';
import {
  budgetExceededMessage,
  budgetWarningMessage,
  categoryPickerMessage,
  currency,
  formatAmount,
  formatShortDate,
  txConfirmationMessage,
} from './bot.format';

interface PendingTx {
  type: Type;
  amount: number;
  note?: string;
  date?: Date;
  chatId: number;
  userId: string;
}

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf | null = null;
  private readonly pending = new Map<number, PendingTx>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly txService: TransactionsService,
    private readonly analyticsService: AnalyticsService,
    private readonly aiService: AIService,
    private readonly authService: AuthService,
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
    this.launchWithRetry(this.bot);
  }

  private launchWithRetry(bot: Telegraf, attempt = 1) {
    bot
      .launch({ dropPendingUpdates: true })
      .then(() => this.logger.log('🤖 Telegram bot stopped'))
      .catch((e: Error) => {
        const msg = e.message ?? '';
        if (msg.includes('409')) {
          // Another instance is polling — wait for it to die then retry
          const delay = Math.min(attempt * 5000, 30000);
          this.logger.warn(
            `Bot 409 conflict (attempt ${attempt}) — retrying in ${delay / 1000}s`,
          );
          setTimeout(() => this.launchWithRetry(bot, attempt + 1), delay);
        } else {
          this.logger.warn(`Bot launch failed: ${msg}`);
        }
      });
    this.logger.log(`🤖 Telegram bot polling started (attempt ${attempt})`);
  }

  async onModuleDestroy() {
    this.bot?.stop('SIGTERM');
  }

  private registerHandlers(bot: Telegraf) {
    bot.start(async (ctx) => {
      const payload = (ctx as Context & { startPayload?: string }).startPayload;
      if (payload?.startsWith('verify_')) {
        await this.handleVerifyDeepLink(ctx, payload.slice('verify_'.length));
        return;
      }

      const user = await this.authService.findUserByChatId(String(ctx.chat.id));
      if (user) {
        const msg = botMessages(user.locale);
        await ctx.reply(
          `👋 ${user.locale === 'ru' ? 'Здравствуйте' : 'Salom'}, ${user.name}!\n\n${msg.WELCOME}`,
        );
      } else {
        await this.askForPhone(ctx);
      }
    });

    bot.on(message('contact'), async (ctx) => {
      await this.handleContact(ctx);
    });

    bot.command('cancel', async (ctx) => {
      this.pending.delete(ctx.chat.id);
      const locale = await this.localeFor(ctx);
      return ctx.reply(botMessages(locale).CANCELLED);
    });

    bot.on(message('text'), async (ctx) => {
      const user = await this.requireUser(ctx);
      if (!user) return;
      try {
        await this.handleText(ctx, user, ctx.message.text);
      } catch (e) {
        this.logger.warn(`Text handler skipped: ${(e as Error).message}`);
        await ctx.reply(botMessages(user.locale).GENERIC_ERROR);
      }
    });

    bot.on(message('voice'), async (ctx) => {
      const user = await this.requireUser(ctx);
      if (!user) return;
      const msg = botMessages(user.locale);
      const processing = await ctx.reply(msg.PROCESSING);
      try {
        const fileId = ctx.message.voice.file_id;
        const link = await ctx.telegram.getFileLink(fileId);
        const audioRes = await axios.get<ArrayBuffer>(link.toString(), {
          responseType: 'arraybuffer',
        });
        const buf = Buffer.from(audioRes.data);
        const text = await this.aiService.transcribeVoice(buf);
        await ctx.telegram
          .deleteMessage(ctx.chat.id, processing.message_id)
          .catch(() => void 0);
        if (!text) {
          await ctx.reply(msg.AI_UNAVAILABLE);
          return;
        }
        await ctx.reply(`🎙 "${text}"`);
        await this.handleText(ctx, user, text);
      } catch (e) {
        this.logger.warn(`Voice handler skipped: ${(e as Error).message}`);
        await ctx.reply(msg.GENERIC_ERROR);
      }
    });

    bot.action(new RegExp(`^${CALLBACK.PICK_CATEGORY}:(.+)$`), async (ctx) => {
      const categoryId = ctx.match[1];
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const pending = this.pending.get(chatId);
      const locale = await this.localeFor(ctx);
      const msg = botMessages(locale);
      if (!pending) {
        await ctx.answerCbQuery(msg.TX_NOT_FOUND);
        return;
      }
      await ctx.answerCbQuery();
      try {
        const tx = await this.txService.create(pending.userId, {
          type: pending.type,
          amount: pending.amount,
          categoryId,
          note: pending.note,
          date: pending.date?.toISOString(),
          source: Source.TELEGRAM,
        });
        this.pending.delete(chatId);
        if (ctx.callbackQuery.message) {
          await ctx.editMessageText(txConfirmationMessage(tx, locale), {
            reply_markup: this.txActionsKeyboard(tx.id, locale).reply_markup,
          });
        }
        await this.checkBudget(pending.userId, chatId, tx.categoryId, locale);
      } catch (e) {
        this.logger.warn(`Save from pick skipped: ${(e as Error).message}`);
        await ctx.reply(msg.GENERIC_ERROR);
      }
    });

    bot.action(new RegExp(`^${CALLBACK.DELETE_TX}:(.+)$`), async (ctx) => {
      const txId = ctx.match[1];
      const user = await this.authService.findUserByChatId(
        String(ctx.chat?.id ?? ''),
      );
      if (!user) {
        await ctx.answerCbQuery();
        return;
      }
      const msg = botMessages(user.locale);
      try {
        await this.txService.delete(user.id, txId);
        await ctx.answerCbQuery(msg.DELETED);
        if (ctx.callbackQuery.message) {
          await ctx.editMessageText(`🗑 ${msg.DELETED}`);
        }
      } catch {
        await ctx.answerCbQuery(msg.DELETE_FAILED);
      }
    });

    bot.action(new RegExp(`^${CALLBACK.EDIT_TX}:(.+)$`), async (ctx) => {
      const locale = await this.localeFor(ctx);
      const url = this.dashboardUrl();
      await ctx.answerCbQuery();
      await ctx.reply(botMessages(locale).EDIT_REDIRECT(url));
    });

    bot.action(CALLBACK.CANCEL, async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) this.pending.delete(chatId);
      const locale = await this.localeFor(ctx);
      const msg = botMessages(locale);
      await ctx.answerCbQuery(msg.CANCELLED);
      if (ctx.callbackQuery.message) {
        await ctx.editMessageText(msg.CANCELLED);
      }
    });
  }

  private async localeFor(ctx: Context): Promise<Locale> {
    const chatId = ctx.chat?.id;
    if (!chatId) return 'uz';
    const user = await this.authService.findUserByChatId(String(chatId));
    return user?.locale ?? 'uz';
  }

  private async requireUser(ctx: Context): Promise<User | null> {
    const chatId = ctx.chat?.id;
    if (!chatId) return null;
    const user = await this.authService.findUserByChatId(String(chatId));
    if (!user) {
      const msg = botMessages('uz');
      await ctx.reply(
        `${msg.NOT_REGISTERED}\n${this.dashboardUrl()}/register`,
      );
      return null;
    }
    return user;
  }

  private async askForPhone(ctx: Context) {
    await ctx.reply(
      '👋 Salom! Data365 botiga xush kelibsiz.\n\nDashboard\'da ro\'yxatdan o\'tganda kod avtomatik kelishi uchun telefon raqamingizni ulang 👇',
      Markup.keyboard([
        [Markup.button.contactRequest('📱 Telefon raqamni ulash')],
      ])
        .oneTime()
        .resize(),
    );
  }

  private async handleContact(ctx: Context) {
    if (!ctx.chat || !('contact' in ctx.message!)) return;
    const contact = (ctx.message as { contact: { phone_number: string } }).contact;
    const chatId = String(ctx.chat.id);
    const rawPhone = contact.phone_number;
    const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;

    await this.prisma.telegramBinding.upsert({
      where: { phone },
      create: { phone, chatId },
      update: { chatId },
    });

    // Check for a pending OTP for this phone
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (otp) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { chatId },
      });
      await ctx.replyWithHTML(
        botMessages(otp.locale).VERIFY_OK(otp.code),
        Markup.removeKeyboard(),
      );
    } else {
      await ctx.reply(
        '✅ Telefon raqamingiz ulandi!\n\nEndi dashboard\'da ro\'yxatdan o\'tganingizda kod to\'g\'ridan-to\'g\'ri shu yerga keladi.',
        Markup.removeKeyboard(),
      );
    }
  }

  private async handleVerifyDeepLink(ctx: Context, token: string) {
    if (!ctx.chat) return;
    const result = await this.authService.bindChatToOtp(
      token,
      String(ctx.chat.id),
    );
    if (!result) {
      await ctx.reply(botMessages('uz').VERIFY_INVALID);
      return;
    }
    await ctx.replyWithHTML(botMessages(result.locale).VERIFY_OK(result.code));
  }

  private txActionsKeyboard(txId: string, locale: Locale) {
    const msg = botMessages(locale);
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(msg.EDIT_BTN, `${CALLBACK.EDIT_TX}:${txId}`),
        Markup.button.callback(msg.DELETE_BTN, `${CALLBACK.DELETE_TX}:${txId}`),
      ],
    ]);
  }

  private async categoryPickerKeyboard(
    userId: string,
    type: Type,
    locale: Locale,
  ) {
    const cats = await this.prisma.category.findMany({
      where: { userId, type },
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
    rows.push([Markup.button.callback(botMessages(locale).CANCEL_BTN, CALLBACK.CANCEL)]);
    return Markup.inlineKeyboard(rows);
  }

  private async handleText(ctx: Context, user: User, text: string) {
    if (!ctx.chat) return;
    const msg = botMessages(user.locale);
    const cats = await this.prisma.category.findMany({
      where: { userId: user.id },
      select: { name: true, type: true },
    });

    const intent = await this.aiService.parseIntent(text, cats, user.locale);
    this.logger.debug(`Intent: ${JSON.stringify(intent)}`);

    if (intent.action === 'DELETE_LAST') {
      await this.handleDeleteLast(ctx, user);
      return;
    }

    if (intent.action === 'QUERY') {
      await this.handleQuery(ctx, user, intent);
      return;
    }

    if (intent.action === 'UNCLEAR') {
      await ctx.reply(intent.clarificationQuestion ?? msg.UNCLEAR_FALLBACK);
      return;
    }

    if (intent.clarificationNeeded || !intent.amount || intent.amount <= 0) {
      await ctx.reply(intent.clarificationQuestion ?? msg.AMOUNT_REQUIRED);
      return;
    }

    const type: Type = intent.action === 'LOG_INCOME' ? 'INCOME' : 'EXPENSE';
    const date = intent.date ? new Date(intent.date) : new Date();

    let category: Category | null = null;
    if (intent.categoryGuess) {
      category = await this.prisma.category.findFirst({
        where: {
          userId: user.id,
          type,
          name: { equals: intent.categoryGuess, mode: 'insensitive' },
        },
      });
    }

    if (!category) {
      this.pending.set(ctx.chat.id, {
        type,
        amount: intent.amount,
        note: intent.note,
        date,
        chatId: ctx.chat.id,
        userId: user.id,
      });
      const kb = await this.categoryPickerKeyboard(user.id, type, user.locale);
      await ctx.reply(categoryPickerMessage(type, user.locale), kb);
      return;
    }

    const tx = await this.txService.create(user.id, {
      type,
      amount: intent.amount,
      categoryId: category.id,
      note: intent.note,
      date: date.toISOString(),
      source: Source.TELEGRAM,
    });

    await ctx.reply(
      txConfirmationMessage(tx, user.locale),
      this.txActionsKeyboard(tx.id, user.locale),
    );

    await this.checkBudget(user.id, ctx.chat.id, category.id, user.locale);
  }

  private async handleDeleteLast(ctx: Context, user: User) {
    const msg = botMessages(user.locale);
    try {
      const last = await this.txService.deleteLast(user.id, Source.TELEGRAM);
      await ctx.reply(
        msg.DELETE_LAST_OK(formatAmount(last.amount), last.category.name),
      );
    } catch {
      await ctx.reply(msg.NO_LAST_TX);
    }
  }

  private async handleQuery(ctx: Context, user: User, intent: ParsedIntent) {
    const locale = user.locale;
    const cur = currency(locale);
    const period =
      intent.queryType === 'THIS_WEEK'
        ? 'week'
        : intent.queryType === 'LAST_MONTH'
          ? 'last-month'
          : 'month';

    const periodLabels: Record<Locale, Record<string, string>> = {
      uz: { week: 'Shu hafta', 'last-month': "O'tgan oy", month: 'Bu oy' },
      ru: { week: 'Эта неделя', 'last-month': 'Прошлый месяц', month: 'Этот месяц' },
    };
    const reportLabels: Record<Locale, { report: string; income: string; expense: string; net: string; total: string; txCount: string; top: string }> = {
      uz: {
        report: "bo'yicha hisobot",
        income: 'Kirim',
        expense: 'Xarajat',
        net: 'Sof',
        total: 'Jami',
        txCount: 'ta tranzaksiya',
        top: 'Top',
      },
      ru: {
        report: '— отчёт',
        income: 'Доход',
        expense: 'Расход',
        net: 'Чистый',
        total: 'Всего',
        txCount: 'транзакций',
        top: 'Топ',
      },
    };

    let category: Category | null = null;
    if (intent.queryCategory || intent.categoryGuess) {
      const name = intent.queryCategory ?? intent.categoryGuess;
      if (name) {
        category = await this.prisma.category.findFirst({
          where: {
            userId: user.id,
            name: { equals: name, mode: 'insensitive' },
          },
        });
      }
    }

    if (category) {
      const { start, end } = this.analyticsService.resolvePeriod(period);
      const txs = await this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          categoryId: category.id,
          date: { gte: start, lte: end },
        },
        orderBy: { amount: 'desc' },
      });
      const total = txs.reduce((s, t) => s + t.amount, 0);
      const top = txs.slice(0, 3);
      const r = reportLabels[locale];

      const lines = [
        `📊 ${category.name} — ${periodLabels[locale][period]}`,
        '',
        `${category.type === 'INCOME' ? '💰' : '💸'} ${r.total}: ${formatAmount(total)} ${cur}`,
        `📝 ${txs.length} ${r.txCount}`,
      ];
      if (top.length > 0) {
        lines.push('', `${r.top}:`);
        for (const t of top) {
          const d = formatShortDate(new Date(t.date), locale);
          lines.push(`• ${d} — ${formatAmount(t.amount)} ${cur}`);
        }
      }
      await ctx.reply(lines.join('\n'));
      return;
    }

    const overview = await this.analyticsService.overview(user.id, period);
    const r = reportLabels[locale];
    await ctx.reply(
      [
        `📊 ${periodLabels[locale][period]} ${r.report}`,
        '',
        `💰 ${r.income}: ${formatAmount(overview.income.total)} ${cur}`,
        `💸 ${r.expense}: ${formatAmount(overview.expense.total)} ${cur}`,
        `📈 ${r.net}: ${formatAmount(overview.net.total)} ${cur}`,
      ].join('\n'),
    );
  }

  private async checkBudget(
    userId: string,
    chatId: number,
    categoryId: string,
    locale: Locale,
  ) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
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
        userId,
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
        budgetExceededMessage(cat, cat.budget, locale),
      );
    } else if (usage >= 80) {
      await this.bot.telegram.sendMessage(
        chatId,
        budgetWarningMessage(cat, spent, cat.budget, locale),
      );
    }
  }

  private dashboardUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }
}
