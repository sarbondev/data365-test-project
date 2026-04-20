# Business Finance Manager — Claude Code Prompt
> data365 Agency · Task 01 · Full-Stack Build Prompt

---

## OVERVIEW

You are building a **production-ready Business Finance Manager** — a full-stack application for small and medium businesses in Uzbekistan to manage company cash flow through a Telegram bot and a web dashboard.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Backend | Node.js + NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Telegram Bot | Telegraf |
| AI | OpenAI Whisper (voice) + GPT-4o (NLP) |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Auth | JWT |
| DevOps | Docker Compose |

---

## PROJECT STRUCTURE

```
/
├── backend/
│   ├── src/
│   │   ├── bot/              # Telegram bot module
│   │   ├── transactions/     # CRUD + business logic
│   │   ├── categories/       # Category management
│   │   ├── analytics/        # Aggregations & reports
│   │   ├── ai/               # Whisper + GPT-4o integration
│   │   └── prisma/           # Prisma service
│   └── prisma/
│       └── schema.prisma
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Overview
        │   ├── transactions/         # Transactions page
        │   ├── analytics/            # Analytics page
        │   └── categories/           # Categories page
        ├── components/
        └── lib/
            └── api.ts                # Centralized API client
```

---

## DATABASE SCHEMA (Prisma)

```prisma
model Transaction {
  id         String   @id @default(cuid())
  type       Type
  amount     Float
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  note       String?
  date       DateTime @default(now())
  source     Source   @default(DASHBOARD)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Category {
  id           String        @id @default(cuid())
  name         String
  type         Type
  color        String
  icon         String?
  isDefault    Boolean       @default(false)
  budget       Float?
  transactions Transaction[]
  createdAt    DateTime      @default(now())
}

enum Type   { INCOME EXPENSE }
enum Source { DASHBOARD TELEGRAM }
```

---

## BACKEND — NestJS MODULES

### TransactionsModule
- `GET    /transactions` — list with filters: `?type` `?categoryId` `?startDate` `?endDate` `?search`
- `POST   /transactions` — create
- `PATCH  /transactions/:id` — update
- `DELETE /transactions/:id` — delete
- `GET    /transactions/summary` — total income, expense, net + comparison with previous period

### CategoriesModule
- Full CRUD
- **Seed default categories on first run:**
  - INCOME: Savdo, Xizmat, Investitsiya, Boshqa
  - EXPENSE: Ijara, Logistika, Maosh, Marketing, Kommunal, Boshqa

### AnalyticsModule
- `GET /analytics/overview` — current month vs last month
- `GET /analytics/by-category` — breakdown by category
- `GET /analytics/trend` — daily trend data for charts
- `GET /analytics/budget-status` — category budget usage %

### BotModule
- Polling mode for development
- Handles: text messages + voice messages
- **Voice flow:** download → Whisper → transcript → GPT parse
- **Text flow:** GPT parse directly

### AIModule

```typescript
interface ParsedIntent {
  action: 'LOG_INCOME' | 'LOG_EXPENSE' | 'QUERY' | 'DELETE_LAST' | 'UNCLEAR'
  amount?: number
  categoryGuess?: string
  note?: string
  date?: string
  queryType?: 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'
  clarificationNeeded?: boolean
  clarificationQuestion?: string
}
```

**GPT-4o system prompt (use exactly):**
```
You are a financial assistant for a small Uzbek business.
Parse the user message and return a JSON object:
{ action, amount, categoryGuess, note, date, queryType, clarificationNeeded, clarificationQuestion }

Rules:
- If amount is missing for a financial action → clarificationNeeded: true
- If category is unclear → make a smart guess, set categoryGuess
- Treat numbers without currency as UZS (so'm)
- date: if not specified, use today. Support "bugun", "kecha", "today", "yesterday"
- action QUERY = user is asking about their data
- Respond ONLY with valid JSON, no markdown, no extra text
```

---

## TELEGRAM BOT — Full Behavior

### Commands
- `/start` — welcome message + instructions
- `/cancel` — cancel current operation

### Transaction Flow

1. User sends voice or text
2. Bot replies: `⏳ Qayta ishlanmoqda...` (for voice messages)
3. AI parses intent
4. **If complete → save → confirm:**

```
✅ Kirim saqlandi

💰 Summa: 2,500,000 so'm
📂 Kategoriya: Savdo
📅 Sana: 20 aprel 2025
📝 Izoh: Klient to'lovi

[✏️ Tahrirlash]  [🗑 O'chirish]
```

5. **If unclear → inline keyboard:**

```
❓ Kategoriyani tanlang:

[💼 Savdo]  [🚚 Logistika]  [👥 Maosh]  [📦 Boshqa]
```

### Query Flow

User: `"Bu oyda logistikaga qancha sarfladik?"`

Bot:
```
📊 Logistika xarajatlari — Aprel 2025

💸 Jami: 4,750,000 so'm
📝 7 ta tranzaksiya

Top xarajatlar:
• 18 apr — 1,200,000 so'm
• 15 apr — 980,000 so'm
• 12 apr — 750,000 so'm
```

### Error Handling Rules
- **Never** crash on unclear input
- **Always** respond within 3 seconds — send processing message first for AI calls
- Validate amounts: no negative, no zero
- If parsing fails → ask follow-up, never silently save wrong data

---

## FRONTEND — Next.js Dashboard

### Design System
- **Background:** Deep navy `#0F172A`
- **Cards:** White / `#1E293B`
- **Accent:** Indigo `#6366F1`
- **Font:** Inter
- **Components:** shadcn/ui throughout
- **Style:** Subtle shadows, `rounded-xl`, clean data tables
- **Transitions:** Smooth page transitions
- **Responsive:** Mobile + Desktop

---

### Page 1 — Overview `/`

**Top row — 3 stat cards:**
- Total Income (current month) + % change vs last month (green ▲)
- Total Expenses + % change (red ▼)
- Net Balance + trend indicator

**Middle row — 2 columns:**
- Left: Area chart — income vs expense (last 30 days, daily)
- Right: Donut chart — top expense categories this month

**Quick Add Transaction form (inline, no page reload):**
- Fields: Type toggle (Income / Expense), Amount, Category dropdown, Date, Note
- Instantly adds and refreshes all dashboard data

**Bottom:** Recent transactions table (last 10, with inline delete)

**Empty State (zero data):**
- Centered SVG illustration
- Heading: `"Moliyaviy ma'lumotlar yo'q"`
- Subtext: `"Telegram bot yoki quyidagi forma orqali birinchi tranzaksiyani qo'shing"`
- Quick Add form highlighted with a subtle glow

---

### Page 2 — Transactions `/transactions`

**Table columns:** Date · Type badge · Category chip (colored) · Amount · Note · Source (Bot / Dashboard) · Actions

**Filter bar:**
- Date range picker
- Type toggle (Income / Expense / All)
- Category multi-select
- Search input

**Features:**
- Inline edit (click edit → row becomes editable fields)
- Inline delete with confirmation tooltip
- Pagination (20 per page)
- Export to CSV button

---

### Page 3 — Analytics `/analytics`

**Period selector:** This week · This month · Last month · Custom range

| Row | Chart |
|---|---|
| 1 | Income by category — horizontal bar chart |
| 2 | Expense by category — horizontal bar chart |
| 3 | Daily trend — line chart (income vs expense) |
| 4 | Budget tracker — progress bars per category |

**Summary stats:** Avg daily expense · Biggest single expense · Most active category

---

### Page 4 — Categories `/categories`

- Two columns: Income categories | Expense categories
- Each card: color swatch, name, transaction count, total this month, budget limit
- Add category: inline form — name, type, color picker, emoji, budget limit
- Edit / Delete (blocked if transactions exist — show count)
- Default categories marked with 🔒 (cannot be deleted)

---

### Navigation
- **Desktop:** Sidebar with logo + app name
- **Mobile:** Bottom navigation bar
- Active state clearly highlighted

---

## BONUS FEATURE — Monthly Budget Alerts

Each category can have a monthly budget limit set from the dashboard.

**When 80% reached — bot sends:**
```
⚠️ Byudjet ogohlantirishи

📂 Logistika — 80% sarflandi
💸 4,000,000 / 5,000,000 so'm
📊 Qolgan: 1,000,000 so'm (bu oy)
```

**When 100% reached — bot sends:**
```
🚨 Byudjet tugadi!

📂 Logistika uchun oylik limit to'ldi: 5,000,000 so'm
Yangi xarajat limitdan oshib ketdi.
```

---

## ENVIRONMENT VARIABLES

```env
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/financedb
TELEGRAM_BOT_TOKEN=your_bot_token
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=http://localhost:3000
PORT=3001

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## DOCKER COMPOSE

Provide a `docker-compose.yml` that starts:
- PostgreSQL database
- NestJS backend
- Next.js frontend

Also provide manual setup:

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## CODE QUALITY REQUIREMENTS

- All NestJS services must use proper dependency injection
- All API responses: `{ data, message, success }` format
- All errors caught — no 500 stack traces exposed to client
- Prisma queries with proper error handling and transactions where needed
- Frontend: **no `any` types** in TypeScript
- Frontend: all API calls through centralized `lib/api.ts`
- Loading states on **every** async action
- Toast notifications for all user actions (success + error)
- No hardcoded strings — use constants files
- README must include: description, tech stack, setup steps, env vars explained

---

## DELIVERABLES CHECKLIST

- [ ] Working Telegram bot (polling mode)
- [ ] NestJS backend — all endpoints functional
- [ ] Next.js dashboard — all 4 pages working
- [ ] PostgreSQL with Prisma migrations
- [ ] Default categories seeded
- [ ] Bot + dashboard real-time sync
- [ ] Budget alert feature in bot
- [ ] `docker-compose.yml`
- [ ] `README.md`
- [ ] `.env.example`

---

## BUILD ORDER

1. Database schema + Prisma migrations + seed
2. NestJS backend — all modules + endpoints
3. Telegram bot — text flow first, then voice
4. Next.js frontend — Overview → Transactions → Analytics → Categories
5. Connect everything end-to-end
6. Docker Compose setup
7. README

> Build the complete application. Do not stop at scaffolding — every feature listed must be fully working.
