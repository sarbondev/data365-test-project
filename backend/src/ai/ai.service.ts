import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { Locale } from '@prisma/client';
import { ParsedIntent } from './ai.types';

const SYSTEM_PROMPT = `You are a financial assistant for a small Uzbek business.
The user writes in Uzbek or Russian — understand both, respond in the user's language.
Parse the user message and return a JSON object:
{ action, amount, categoryGuess, note, date, queryType, clarificationNeeded, clarificationQuestion }

Rules:
- If amount is missing for a financial action → clarificationNeeded: true
- If category is unclear → make a smart guess, set categoryGuess (match available categories when possible)
- Treat numbers without currency as UZS (so'm / сум)
- date: if not specified, use today. Support "bugun"/"сегодня", "kecha"/"вчера", "today", "yesterday"
- action QUERY = user is asking about their data
- clarificationQuestion must be in the user's language (uz or ru)
- Respond ONLY with valid JSON, no markdown, no extra text`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY') ?? '';
    this.client = new OpenAI({ apiKey });
  }

  async transcribeVoice(
    audio: Buffer,
    filename = 'voice.ogg',
  ): Promise<string | null> {
    try {
      const file = await toFile(audio, filename);
      const res = await this.client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });
      return res.text;
    } catch (e) {
      this.logger.warn(
        `Voice transcription unavailable: ${(e as Error).message}`,
      );
      return null;
    }
  }

  async translateCategoryName(
    text: string,
  ): Promise<{ uz: string; ru: string }> {
    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a bilingual translator for business category names (Uzbek/Russian). ' +
              'Return ONLY valid JSON: {"uz": "<uzbek name>", "ru": "<russian name>"}. ' +
              'Keep names short (1-3 words), in title case, business-appropriate. No extra text.',
          },
          {
            role: 'user',
            content: `Translate this business category name to both Uzbek and Russian: "${text}"`,
          },
        ],
      });

      const raw = res.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as { uz?: string; ru?: string };

      return {
        uz: parsed.uz?.trim() || text,
        ru: parsed.ru?.trim() || text,
      };
    } catch (e) {
      this.logger.warn(`Category translation unavailable: ${(e as Error).message}`);
      return { uz: text, ru: text };
    }
  }

  async parseIntent(
    text: string,
    categories: Array<{ name: string; type: 'INCOME' | 'EXPENSE' }>,
    locale: Locale = 'uz',
  ): Promise<ParsedIntent> {
    const today = new Date().toISOString().slice(0, 10);
    const catList = categories
      .map((c) => `${c.name} (${c.type})`)
      .join(', ');

    const userPrompt = `Today: ${today}
User language: ${locale}
Available categories: ${catList}

User message: "${text}"

Return only JSON. If you need clarification, write it in ${locale === 'ru' ? 'Russian' : 'Uzbek'}.`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });

      const raw = res.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as ParsedIntent;

      if (!parsed.action) parsed.action = 'UNCLEAR';
      return parsed;
    } catch (e) {
      this.logger.warn(
        `Intent parsing unavailable: ${(e as Error).message}`,
      );
      return {
        action: 'UNCLEAR',
        clarificationNeeded: true,
        clarificationQuestion:
          locale === 'ru'
            ? '🤖 AI временно недоступен. Попробуйте позже.'
            : "🤖 AI vaqtincha ishlamayapti. Iltimos, birozdan keyin qayta urinib ko'ring.",
      };
    }
  }
}
