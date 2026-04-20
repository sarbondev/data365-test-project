import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { ParsedIntent } from './ai.types';

const SYSTEM_PROMPT = `You are a financial assistant for a small Uzbek business.
Parse the user message and return a JSON object:
{ action, amount, categoryGuess, note, date, queryType, clarificationNeeded, clarificationQuestion }

Rules:
- If amount is missing for a financial action → clarificationNeeded: true
- If category is unclear → make a smart guess, set categoryGuess
- Treat numbers without currency as UZS (so'm)
- date: if not specified, use today. Support "bugun", "kecha", "today", "yesterday"
- action QUERY = user is asking about their data
- Respond ONLY with valid JSON, no markdown, no extra text`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY') ?? '';
    this.client = new OpenAI({ apiKey });
  }

  async transcribeVoice(audio: Buffer, filename = 'voice.ogg'): Promise<string> {
    const file = await toFile(audio, filename);
    const res = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });
    return res.text;
  }

  async parseIntent(
    text: string,
    categories: Array<{ name: string; type: 'INCOME' | 'EXPENSE' }>,
  ): Promise<ParsedIntent> {
    const today = new Date().toISOString().slice(0, 10);
    const catList = categories
      .map((c) => `${c.name} (${c.type})`)
      .join(', ');

    const userPrompt = `Today: ${today}
Available categories: ${catList}

User message: "${text}"

Return only JSON.`;

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
      this.logger.error('Intent parsing failed', e as Error);
      return {
        action: 'UNCLEAR',
        clarificationNeeded: true,
        clarificationQuestion:
          "Iltimos, xabaringizni qayta yuboring. Masalan: \"Bugun ijaraga 3 mln so'm to'ladim\"",
      };
    }
  }
}
