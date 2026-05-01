# TITAN-94 «ОКО НЕБЕСНЕ» — Project Konspekt

> Останнє оновлення: 2026-05-01

---

## Огляд

pnpm monorepo + TypeScript. Два незалежних продукти в одному репо:

1. **ENACT Dashboard** — React/Vite фронтенд + Express API для перегляду ENACT Protocol jobs на TON
2. **TITAN-94 Autonomous Agent** — автономний AI-організм безпеки TON блокчейну (4 цикли: SCAN / HEAL / LEARN / FINANCE)

---

## Стек

| Шар | Технологія |
|---|---|
| Runtime | Node.js 24 |
| Пакетний менеджер | pnpm 10 (workspaces) |
| Мова | TypeScript 5.9 |
| API сервер | Express 5 |
| База даних | PostgreSQL + Drizzle ORM |
| Валідація | Zod (`zod/v4`), `drizzle-zod` |
| Codegen | Orval (з OpenAPI spec) |
| Build | esbuild (CJS bundle via `build.mjs`) |
| Фронтенд | React + Vite + Tailwind v4 + shadcn/ui + wouter + TanStack Query |
| Автономний агент | Node.js (standalone npm, поза монорепо) |

---

## Структура репо

```
workspace/
├── artifacts/
│   ├── api-server/          # Express API (port 8080) — TITAN-94 core
│   └── enact-dashboard/     # React+Vite frontend (port 20474)
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen config
│   ├── api-client-react/    # Згенеровані React Query hooks
│   ├── api-zod/             # Згенеровані Zod схеми з OpenAPI
│   └── db/                  # Drizzle ORM schema + DB connection
├── Titan_94_agent/          # Автономний TON AI агент (окремий npm проєкт)
│   ├── agent.js             # Весь агент в одному файлі (~800 рядків)
│   ├── contracts/           # GenesisTitan.tact, Titan94Agent.tact
│   └── package.json         # telegraf, @ton/*, @google/generative-ai
├── scripts/                 # Утиліти
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

---

## Workflows (всі запущені)

| Workflow | Команда | Порт |
|---|---|---|
| `Titan_94: Autonomous Agent` | `cd Titan_94_agent && node agent.js` | 3000 |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | 8080 |
| `artifacts/enact-dashboard: web` | `pnpm --filter @workspace/enact-dashboard run dev` | 20474 |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | 8081 |

---

## TITAN-94 — Ядро API сервера

### Автономні цикли (`services/heartbeat.ts`)

Запускаються одразу після старту сервера і працюють вічно:

| Цикл | Інтервал | Що робить |
|---|---|---|
| **SCAN** | 3 хв | Реальний seqno з TonCenter, баланс Reserve wallet, запис в `activity` |
| **HEAL** | 5 хв | Бере невилікувану вразливість з DB, просить Gemini план, маркує `healed` |
| **LEARN** | 7 хв | Gemini генерує новий regex-патерн, зберігає в `knowledge`, підвищує `accuracy` |
| **FINANCE** | 10 хв | Підраховує активних підписників, автоматично закінчує протерміновані плани, читає баланс Reserve |

### Служби (`services/`)

| Файл | Роль |
|---|---|
| `sentinel.ts` | `process.on("uncaughtException"/"unhandledRejection")` — щит процесу |
| `heartbeat.ts` | 4 цикли + auto-earn + ton-poller |
| `store.ts` | Єдине джерело правди для всіх DB читань/записів |
| `ton-scanner.ts` | TonCenter API v2 клієнт (без ключа = throttled, з `TON_API_KEY` = швидше) |
| `mirror.ts` | Внутрішній mirror стану агента для routes |
| `secrets.ts` | Завантаження секретів з vault при старті |
| `telegram-bot.ts` | Telegram bot (вимкнений без `TELEGRAM_BOT_TOKEN`) |

### Захист від зупинки (НІКОЛИ не вимикається)

**`artifacts/api-server/src/index.ts`:**
- `process.exit` повністю видалений
- `startServer(attempt)` — retry loop при `EADDRINUSE` (до 5 спроб × 2 сек)
- `setInterval(() => {}, 1h).unref()` — watchdog, не дає Node.js завершитись
- Усі помилки listen → лог, але НЕ exit

**`Titan_94_agent/agent.js`:**
- `process.exit(1)` → retry `setTimeout(startAgent, 10_000)`
- `SIGTERM/SIGINT` → зупиняє цикли, перезапускає їх через 3 сек (НЕ exit)
- `uncaughtException` / `unhandledRejection` → лог, staying alive
- `setInterval(() => {}, 1h).unref()` — watchdog

---

## База даних (PostgreSQL + Drizzle)

11 таблиць, схема у `lib/db/`:

| Таблиця | Призначення |
|---|---|
| `users` | Акаунти + реферальна система |
| `referrals` | Граф рефералів |
| `vulnerabilities` | Вразливості TON контрактів (SCAN цикл) |
| `activity` | Повний аудит-лог кожного циклу та події |
| `knowledge` | AI база знань (LEARN цикл) |
| `subscribers` | Підписники (free/pro/elite) |
| `agent_state` | Singleton: цикли, accuracy, lastBlockSeqno |
| `competitors` | Маркет-інтел |
| `blocked_addresses` | Blacklist scam адрес |
| `billing_ledger` | CPA / bounty / withdrawal / subscription |
| `ton_payments` | Верифіковані on-chain TON платежі |

Синхронізація схеми: `pnpm --filter @workspace/db run push`
Seed запускається автоматично при старті через `ensureSeed()`.

---

## ENACT Protocol — Реальні дані

### Адреси

| Контракт | Адреса |
|---|---|
| JobFactory | `EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX` |
| JettonJobFactory (USDT) | `EQCgYmwi8uwrG7I6bI3Cdv0ct-bAB1jZ0DQ7C3dX3MYn6VTj` |
| Default AI Evaluator | `UQCDP52RhgJmylkjOBSJGqCsaTwRo9XFzrr6opHUg4mqkQAu` |

### Як працює `fetchFactoryEvents` (`lib/ton.ts`)

ENACT factory емітує `SmartContractExec` (не `ContractDeploy`).
Функція читає останні події factory через TONAPI v2, знаходить `SmartContractExec` actions,
дістає адресу executor'а (задеплоєний job контракт), визначає стан job по його власним подіям.
При помилці повертає `[]` (не demo дані).

### Стани Job

`OPEN → FUNDED → SUBMITTED → COMPLETED | DISPUTED | CANCELLED`

---

## Reserve Wallet

```
UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v
```
Отримує всі платежі підписок. Баланс читається реально (TonCenter) кожного SCAN + FINANCE циклу.

---

## API Endpoints

### ENACT / Jobs
```
GET  /api/healthz
GET  /api/jobs                    ?state= ?type= ?limit= ?offset=
GET  /api/jobs/:address
POST /api/jobs/create-link        → Tonkeeper deeplink
GET  /api/stats                   → агрегована статистика протоколу
```

### TITAN-94 Agent
```
GET  /api/agent/stats             → cycles, accuracy, lastBlockSeqno
GET  /api/agent/cycles            → таймстемпи останніх запусків
POST /api/agent/scan              → ручний запуск SCAN циклу
GET  /api/vulnerabilities         ?severity= ?status= ?limit= ?offset=
GET  /api/vulnerabilities/:id
GET  /api/activity                → пагінований лог
```

### AI / Аналіз
```
POST /api/analyze                 → Gemini аудит контракту
POST /api/analyze/honeypot        → детектор honeypot
GET  /api/ai-evolution/status
GET  /api/ai-evolution/knowledge
POST /api/ai-evolution/trigger
GET  /api/ecosystem/overview      → health всіх компонентів
```

### Монетизація
```
GET  /api/monetization/plans
GET  /api/monetization/revenue
GET  /api/monetization/subscribers
GET  /api/monetization/status/:telegramId
POST /api/monetization/subscribe
```

### Webhook / Payments
```
POST /api/webhook/ton-payment     → on-chain верифікація + активація плану
GET  /api/webhook/verify/:txHash  → статус транзакції (DB + on-chain)
GET  /api/webhook/reserve-balance → живий баланс Reserve wallet
GET  /api/billing/balance/:telegramId
GET  /api/billing/history/:telegramId
GET  /api/billing/stats
POST /api/billing/withdraw
```

### TON Network
```
GET  /api/ton/network             → mainnet info, lastBlock seqno
GET  /api/ton/wallet              → баланс Reserve wallet (детально)
GET  /api/ton/transactions        → останні транзакції Reserve wallet
```

---

## Titan_94 Agent (standalone)

Файл: `Titan_94_agent/agent.js` (~800 рядків, CommonJS)

| Клас | Роль |
|---|---|
| `GeminiCore` | Google Gemini API — аналіз контрактів, класифікація |
| `TonScanner` | TONAPI: скануює нові контракти, bug bounty rounds |
| `BugBountyHunter` | Дедуплікація, трекінг, форматування знахідок |
| `TelegramAgent` | Telegraf bot: команди `/scan /status /report /bounty` |
| `AutonomousLoop` | setInterval: scan 5 хв, report 1 год |
| `Titan94Agent` | Оркестратор усіх вище |
| `startHealthServer` | HTTP сервер `/health` на `PORT` (default 3000) |

### Smart Contracts (Tact)
- `GenesisTitan.tact` — збереження хешу знань + self-funding (20% балансу → owner)
- `Titan94Agent.tact` — лічильник + контроль доступу власника

---

## Секрети (Environment Variables)

### API Server (деградована робота без них)

| Змінна | Роль | Без неї |
|---|---|---|
| `GEMINI_API_KEY` | Реальні AI плани лікування, аналіз | keyword fallback |
| `TON_API_KEY` | TonCenter API key (знімає rate limit) | throttled, 1 req/sec |
| `TELEGRAM_BOT_TOKEN` | Telegram бот у API сервері | bot вимкнений |
| `TELEGRAM_ADMIN_CHAT_ID` | ID чату для сповіщень | — |
| `ADMIN_TELEGRAM_ID` | Default: `7255058720` | — |

### Titan_94 Agent (standalone)

| Змінна | Роль |
|---|---|
| `TELEGRAM_BOT_TOKEN_2` | Токен бота (окремий від API server) |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin chat ID |
| `TELEGRAM_REPORT_CHANNEL` | Канал для звітів |
| `GEMINI_API_KEY` | Google AI Studio |
| `TON_API_KEY` | toncenter.com (опційно) |
| `TONAPI_KEY` | tonapi.io (опційно) |
| `TON_MNEMONIC` | 24 слова мнемоніки (опційно, read-only без неї) |

---

## Codegen / TypeScript

```bash
# Регенерувати Zod схеми та React Query hooks з OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Повна перевірка типів
pnpm run typecheck

# Збірка API сервера
pnpm --filter @workspace/api-server run build
```

**Правила:**
- `lib/*` — composite, емітують declarations через `tsc --build`
- `artifacts/*` — leaf packages, typechecked з `tsc --noEmit`
- Артефакти НЕ додаються до кореневого `tsconfig.json`

---

## Важливі файли

| Файл | Призначення |
|---|---|
| `artifacts/api-server/src/index.ts` | Entry point, never-exit логіка |
| `artifacts/api-server/src/app.ts` | Express app + sentinel (armSentinel) |
| `artifacts/api-server/src/services/heartbeat.ts` | 4 цикли + auto-earn + ton-poller |
| `artifacts/api-server/src/services/store.ts` | Всі DB операції |
| `artifacts/api-server/src/services/sentinel.ts` | Process-level crash guard |
| `artifacts/api-server/src/services/mirror.ts` | Стан агента для routes |
| `artifacts/api-server/src/lib/ton.ts` | TONAPI/TonCenter клієнт, fetchFactoryEvents |
| `artifacts/api-server/src/routes/jobs.ts` | ENACT jobs (реальні дані з TONAPI) |
| `artifacts/api-server/src/routes/stats.ts` | Статистика протоколу (реальні дані) |
| `artifacts/api-server/src/routes/ton-routes.ts` | Network/wallet/transactions (реальні) |
| `artifacts/api-server/src/routes/webhook.ts` | TON payment webhook + on-chain verify |
| `Titan_94_agent/agent.js` | Автономний агент, never-exit |
| `lib/db/src/schema.ts` | Drizzle ORM схема всіх 11 таблиць |
