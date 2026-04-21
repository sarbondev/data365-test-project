# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Business Finance Manager** — cash-flow tool for SMEs in Uzbekistan. Telegram bot (Uzbek text + voice) and Next.js dashboard share a single PostgreSQL database. Backend is NestJS + Prisma + Telegraf + OpenAI (Whisper for voice → GPT-4o for intent parsing). It is a monorepo with `backend/` and `frontend/` workspaces orchestrated by a root `package.json`.

## Common commands

Run from the repo root unless noted:

```bash
npm run install:all      # installs root + backend + frontend
npm run dev              # runs backend (start:dev) and frontend (next dev) concurrently
npm run build            # nest build && next build
npm run db:migrate       # prisma migrate deploy (production-style)
npm run db:seed          # seeds default INCOME/EXPENSE categories
docker-compose up --build   # Postgres + backend + frontend
```

Backend-only (in `backend/`):

```bash
npm run start:dev        # NestJS watch mode — also boots the Telegram bot
npm run lint             # eslint --fix on src/**/*.ts
npx prisma migrate dev   # create + apply a new migration locally
npx prisma generate      # regenerate the Prisma client (run after editing schema.prisma)
```

Frontend-only (in `frontend/`):

```bash
npm run dev              # Next.js dev server on :3000
npm run lint             # next lint
```

There is no test runner configured in either workspace.

## Architecture

### Backend (`backend/src/`) — NestJS modules

All HTTP responses are wrapped by `common/response.interceptor.ts` into `{ data, message, success }`. Errors go through `common/all-exceptions.filter.ts`. A global `ValidationPipe` with `whitelist: true, transform: true` is applied in `main.ts`, so controller DTOs (`class-validator` decorators) are the validation boundary — no manual checks needed in controllers.

Modules:
- `prisma/` — `PrismaService` exported globally; injected everywhere as the data layer.
- `transactions/` — CRUD + paginated `list()` + `summary()` (period-over-period totals). `deleteLast(source?)` is used by the bot's "delete last transaction" intent.
- `categories/` — CRUD; deleting an `isDefault` category or one with transactions is blocked.
- `analytics/` — `overview`, `byCategory`, `trend`, `budgetStatus`. `resolvePeriod()` is the canonical place that translates a `Period` (`week | month | last-month | custom`) into `{start, end, prevStart, prevEnd}` — reuse it instead of re-deriving period bounds. `trend()` uses a raw SQL `date_trunc('day', ...)` query against Postgres and pre-fills empty days, so don't expect a portable query builder there.
- `ai/` — `AIService` wraps the OpenAI SDK: `transcribeVoice` (Whisper) and `parseIntent` (GPT-4o, `response_format: json_object`). Returns a `ParsedIntent` whose `action` is one of `LOG_INCOME | LOG_EXPENSE | QUERY | DELETE_LAST | UNCLEAR`. The system prompt and the available-categories list are sent on every call.
- `bot/` — `BotService` is a `OnModuleInit` Telegraf bot in **polling mode**. If `TELEGRAM_BOT_TOKEN` is unset, the bot is silently disabled (the rest of the API still runs). Flow per message:
  1. Text or voice (voice → Whisper → text) is fed to `AIService.parseIntent`.
  2. `LOG_*` with a known category → `txService.create` → confirmation card with edit/delete inline buttons.
  3. `LOG_*` with unknown category → stash a `PendingTx` in an in-memory `Map<chatId, …>` and show an inline category picker. The picker callback (`PICK_CATEGORY:<id>`) reads the pending entry and creates the transaction.
  4. `QUERY` → calls `analyticsService.overview()` (or per-category aggregation) and replies with a Uzbek summary.
  5. `DELETE_LAST` → `txService.deleteLast(Source.TELEGRAM)`.
  6. After every successful expense, `checkBudget()` recomputes monthly spend for that category and pushes 80%/100% alerts.

  Pending transactions live only in process memory — restarting the backend drops them, and they are not shared across replicas.

Data model (`prisma/schema.prisma`): `Transaction` (type, amount, categoryId, note, date, source) belongs to `Category` (name, type, color, icon, budget, isDefault). `Source` enum distinguishes `DASHBOARD` vs `TELEGRAM` — used by `deleteLast` and for analytics. Categories are uniquely keyed on `(name, type)`.

### Frontend (`frontend/src/`) — Next.js 14 App Router

- `app/` — route segments: `/` (overview), `/transactions`, `/analytics`, `/categories`. Server/client component split is per-page; data fetching goes through `lib/api.ts`.
- `lib/api.ts` — the single API client. All calls funnel through `request()`, which unwraps the backend's `{ data, message, success }` envelope and throws `ApiError` on `!success`. When adding endpoints, extend the `api` object here rather than calling `fetch` directly from components — the envelope unwrap and `cache: 'no-store'` are already handled.
- `lib/types.ts` — shared types mirroring backend response shapes.
- `constants/` — UI strings (Uzbek). Add new copy here, not inline in components.
- `components/ui/` — shadcn/Radix primitives; other files in `components/` are feature components (charts, transactions table, quick-add form, navigation).

`NEXT_PUBLIC_API_URL` is read at build time for the browser bundle and at runtime in dev. The Docker build passes it via `--build-arg`.

### Cross-cutting

- **Bot ↔ dashboard sync** is just shared Postgres state. There's no websocket or pub/sub — the dashboard refetches with `cache: 'no-store'` and the bot reads on each interaction.
- **Currency / locale**: amounts are stored as `Float`, treated as UZS (so'm). Bot replies and dashboard copy are in Uzbek.
- **AI failure mode**: `parseIntent` catches errors and returns `{ action: 'UNCLEAR', clarificationNeeded: true }` — callers should always handle the `UNCLEAR` action, never assume a successful parse.

## Environment

`.env` at repo root is consumed by `docker-compose.yml`. For non-Docker dev, each workspace also reads its own env (`backend/.env`, `frontend/.env.local`). Required keys: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN` (optional — bot disables if missing), `OPENAI_API_KEY`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`. See `.env.example`.
