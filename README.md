# Business Finance Manager

> **data365 Agency · Task 01**
> Production-ready cash-flow manager for SMEs in Uzbekistan.
> Telegram bot (text + voice) + Next.js dashboard, backed by NestJS + PostgreSQL.

---

## ✨ Features

- 📲 **Telegram bot** — log transactions in **Uzbek text or voice** ("Bugun ijaraga 3 mln so'm to'ladim")
- 🧠 **AI-powered** — OpenAI Whisper transcribes voice → GPT-4o parses intent into structured data
- 📊 **Web dashboard** — Overview, full transactions table, analytics, category management
- 💰 **Budget alerts** — bot notifies at 80% and 100% of monthly category budget
- 🔁 **Real-time sync** — bot and dashboard share the same database
- 🐳 **One-command deploy** — `docker-compose up`

---

## 🧱 Tech stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Backend      | Node.js · NestJS · TypeScript                           |
| Database     | PostgreSQL · Prisma ORM                                 |
| Telegram bot | Telegraf (polling)                                      |
| AI           | OpenAI Whisper (speech-to-text) · GPT-4o (intent parse) |
| Frontend     | Next.js 14 (App Router) · Tailwind CSS · Recharts       |
| DevOps       | Docker Compose                                          |

---

## 🚀 Quick start (Docker)

1. Copy env and fill secrets:
   ```bash
   cp .env.example .env
   # edit .env → add TELEGRAM_BOT_TOKEN and OPENAI_API_KEY
   ```
2. Start everything:
   ```bash
   docker-compose up --build
   ```
3. Open:
   - Dashboard → http://localhost:3000
   - API       → http://localhost:3001
   - Postgres  → localhost:5432

The backend container automatically runs `prisma migrate deploy` and seeds default categories on first boot.

---

## 🛠 Manual setup (without Docker)

You need: Node 20+, PostgreSQL 14+, an OpenAI key, a Telegram bot token (from [@BotFather](https://t.me/botfather)).

### Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, tokens
npm install
npx prisma migrate dev      # creates schema
npx prisma db seed          # seeds default categories
npm run start:dev           # starts API + Telegram bot
```

### Frontend

```bash
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                 # http://localhost:3000
```

---

## 🔐 Environment variables

| Variable              | Where    | Description                                          |
| --------------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`        | backend  | Postgres connection string                           |
| `TELEGRAM_BOT_TOKEN`  | backend  | Token from @BotFather (bot disabled if empty)        |
| `OPENAI_API_KEY`      | backend  | Used by Whisper + GPT-4o                             |
| `FRONTEND_URL`        | backend  | CORS origin for the dashboard                        |
| `PORT`                | backend  | Backend HTTP port (default `3001`)                   |
| `NEXT_PUBLIC_API_URL` | frontend | Backend URL the browser hits                         |
| `POSTGRES_*`          | compose  | DB credentials for the bundled Postgres container    |

---

## 🤖 Telegram bot — usage

| What you do            | Bot reaction                                              |
| ---------------------- | --------------------------------------------------------- |
| `/start`               | Welcome + usage examples                                  |
| `/cancel`              | Cancels the current pending action                        |
| Plain text             | Parsed by GPT-4o → saved or asks a clarification          |
| Voice message          | "⏳ Qayta ishlanmoqda..." → Whisper → GPT → save          |
| Unclear category       | Inline keyboard with category picker                      |
| Question (e.g. "bu oyda logistikaga qancha?") | Returns aggregated summary  |
| Hits 80% / 100% budget | Sends warning / exceeded notification                     |

Examples:

- `Bugun ijaraga 3 mln so'm to'ladim`
- `Klient 2.5 mln to'ladi savdo uchun`
- `Bu hafta marketingga qancha sarfladik?`
- `So'nggi tranzaksiyani o'chir`

---

## 🌐 API (REST)

All responses use the envelope `{ data, message, success }`.

### Transactions
- `GET    /transactions?type=&categoryId=&startDate=&endDate=&search=&page=&pageSize=`
- `GET    /transactions/summary?startDate=&endDate=`
- `POST   /transactions` `{ type, amount, categoryId, note?, date?, source? }`
- `PATCH  /transactions/:id`
- `DELETE /transactions/:id`

### Categories
- `GET    /categories?type=`
- `POST   /categories` `{ name, type, color, icon?, budget? }`
- `PATCH  /categories/:id`
- `DELETE /categories/:id` (blocked if `isDefault` or has transactions)

### Analytics
- `GET /analytics/overview?period=week|month|last-month|custom&startDate=&endDate=`
- `GET /analytics/by-category?period=&type=`
- `GET /analytics/trend?period=`
- `GET /analytics/budget-status`

---

## 🧭 Project layout

```
.
├── backend/
│   ├── src/
│   │   ├── ai/            # Whisper + GPT-4o integration
│   │   ├── analytics/     # Aggregations & reports
│   │   ├── bot/           # Telegram bot (Telegraf)
│   │   ├── categories/    # Categories CRUD
│   │   ├── common/        # Response envelope + global error filter
│   │   ├── prisma/        # PrismaService
│   │   └── transactions/  # Transactions CRUD + summary
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts        # Default categories (Savdo, Ijara, …)
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx           # Overview
        │   ├── transactions/      # Transactions page
        │   ├── analytics/         # Analytics page
        │   └── categories/        # Categories page
        ├── components/            # Charts, table, forms, ui/
        ├── constants/             # All UI strings
        └── lib/
            ├── api.ts             # Centralized API client
            └── types.ts
```

---

## 🌱 Default seeded categories

- **INCOME**: Savdo, Xizmat, Investitsiya, Boshqa
- **EXPENSE**: Ijara, Logistika, Maosh, Marketing, Kommunal, Boshqa

Seeded categories are marked `isDefault: true` and cannot be deleted (only edited).

---

## ✅ Deliverables

- [x] Telegram bot in polling mode (text + voice)
- [x] NestJS backend — Transactions, Categories, Analytics, AI, Bot
- [x] Next.js dashboard — Overview, Transactions, Analytics, Categories
- [x] PostgreSQL schema + Prisma migrations + seed
- [x] Bot ↔ dashboard real-time sync
- [x] Budget alert feature
- [x] `docker-compose.yml`, Dockerfiles, `README.md`, `.env.example`

---

© data365 — Task 01
