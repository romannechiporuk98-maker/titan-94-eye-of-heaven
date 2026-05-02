# TITAN-94 «ОКО НЕБЕСНЕ» — Project Konspekt

> Останнє оновлення: 2026-05-02

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

## DEV MODE — тестування без Telegram

**Проблема:** Replit preview відкривається в браузері, де немає Telegram WebApp. `getTgUser()` повертає `{ id: "demo_user", isReal: false }`. Це блокує все: creator-сторінку, кнопки, API запити з реальним ID.

**Рішення:** `DevModeOverlay` компонент (`src/components/dev-mode.tsx`) — банер у нижній частині, видимий тільки поза Telegram:

- З'являється автоматично коли `user.isReal === false`
- Кнопки симуляції: Creator · ELITE · PRO · FREE · Developer
- При натисканні додає `?_dev_tg=<ID>` до URL та перезавантажується
- `telegram.ts` читає цей параметр і використовує як реальний TG ID
- В реальному Telegram (`isReal === true`) банер повністю прихований

**Ручне тестування** (URL параметр):
```
/creator?_dev_tg=7255058720   → Creator повний доступ
/earn?_dev_tg=1000000001      → ELITE юзер
/?_dev_tg=demo_user           → Скинути до demo
```

**Хардкоджені creator IDs** (мають збігатись в обох місцях):
- `artifacts/enact-dashboard/src/lib/telegram.ts` → `CREATOR_IDS = new Set(["7255058720"])`
- `artifacts/api-server/src/services/creator.ts` → `HARDCODED_CREATORS = ["7255058720"]`

---

## TITAN-94 — Ядро API сервера

### Автономні цикли (`services/heartbeat.ts`)

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
| `ton-scanner.ts` | TonCenter API v2 клієнт |
| `creator.ts` | Creator settings: ціни, цикли, навігація, брендинг (персистуються на диск) |
| `mirror.ts` | Внутрішній mirror стану агента для routes |
| `secrets.ts` | Завантаження секретів з vault при старті |
| `telegram-bot.ts` | Telegram bot (вимкнений без `TELEGRAM_BOT_TOKEN`) |

### Захист від зупинки (НІКОЛИ не вимикається)

**`artifacts/api-server/src/index.ts`:**
- `process.exit` повністю видалений
- `startServer(attempt)` — retry loop при `EADDRINUSE` (до 5 спроб × 2 сек)
- `setInterval(() => {}, 1h).unref()` — watchdog, не дає Node.js завершитись

**`Titan_94_agent/agent.js`:**
- `process.exit(1)` → retry `setTimeout(startAgent, 10_000)`
- `SIGTERM/SIGINT` → зупиняє цикли, перезапускає їх через 3 сек (НЕ exit)
- `uncaughtException` / `unhandledRejection` → лог, staying alive
- `setInterval(() => {}, 1h).unref()` — watchdog

---

## Creator Settings (`services/creator.ts`)

Налаштування творця зберігаються у `.titan-creator-settings.json` (корінь проєкту).

### Поля `CreatorSettings`

| Поле | Тип | Призначення |
|---|---|---|
| `proPriceTon` / `elitePriceTon` / `developerPriceTon` | number | Ціни підписок |
| `freeTrialHours` | number | Тривалість пробного доступу |
| `elitePerCycle` / `proPerCycle` / `developerPerCycle` | number | Auto-earn TON за цикл |
| `autoEarnIntervalMin` | number | Інтервал auto-earn (хв) |
| `minWithdrawalTon` | number | Мінімум виводу |
| `cpaPct` | number | Реферальна комісія % |
| `scanCycleEnabled` ... `tgBotEnabled` | boolean | Перемикачі циклів |
| `welcomeMessage` | string | Привітання в Telegram |
| `reserveAddress` | string | TON адреса Reserve Fund |
| `navVisibility` | `Record<string, boolean>` | **Видимість пунктів меню** (ключ = href) |
| `updatedAt` / `updatedBy` | string | Аудит |

### Правило `navVisibility`

```json
{}                                     // порожній = всі видимі (default)
{ "/threats": false }                  // розділ "Загрози" прихований для всіх
{ "/autotrade": false, "/vault": false } // кілька прихованих
```

### API Endpoints для creator

```
GET  /api/creator/check/:tgId          → { isCreator: boolean }         (публічний)
GET  /api/creator/public-settings      → { navVisibility: {...} }        (публічний, для Layout)
GET  /api/creator/settings             → повні налаштування              (creator only)
POST /api/creator/settings             → зберегти патч налаштувань       (creator only)
POST /api/creator/settings/reset       → скинути до дефолтів             (creator only)
GET  /api/creator/dashboard            → KPI, графіки, підписники        (creator only)
GET  /api/creator/users                → список всіх юзерів              (creator only)
POST /api/creator/user/:id/grant       → видати план вручну              (creator only)
POST /api/creator/exec                 → shell команда                   (creator only)
POST /api/creator/ai/chat              → AI Engineer чат                 (creator only)
POST /api/creator/ai/run               → виконати AI команду             (creator only)
POST /api/creator/grant-developer/:id  → видати Developer план           (creator only)
```

---

## ENACT Dashboard — Навігація та Переклади

### Мови

Підтримуються 3 мови: **uk** (українська, default) · **en** · **ru**

Вибір зберігається в `localStorage` під ключем `titan94.lang`.
Автоматичне визначення за `navigator.language` при першому відвідуванні.

Всі рядки UI визначені у `artifacts/enact-dashboard/src/lib/ui-prefs.ts` в словнику `DICT`.

### Структура DICT

| Префікс ключа | Призначення |
|---|---|
| `nav.*` | Назви пунктів навігації |
| `nav.*.desc` | Опис розділу (для модального вікна ℹ) |
| `nav.*.instr` | Інструкція для користувача (для модального вікна ℹ) |
| `group.*` | Назви груп: TITAN-94 / AGENT / ENACT |
| `tag.*` | Статусні теги: LIVE, ORGANISM ONLINE, CONTRACTS |
| `btn.*` | Кнопки: lang, tz, menu |
| `info.*` | Рядки модального вікна інформації |
| `creator.tab.*` | Назви вкладок Creator-сторінки |
| `creator.kpi.*` | Заголовки KPI-карток Dashboard |
| `creator.menu.*` | Рядки вкладки «Меню» |
| `creator.*` | Загальні рядки Creator-сторінки |

### NAV_ITEMS (19 пунктів)

Визначені і **експортуються** з `artifacts/enact-dashboard/src/components/layout.tsx`:

```typescript
export const NAV_ITEMS: NavItem[] = [ /* 19 items */ ];
export type NavItem = { href, tkey, icon, group };
export type NavGroup = "titan" | "agent" | "enact";
```

Групи:
- **TITAN-94** (9): `/` · `/threats` · `/contracts` · `/analyze` · `/evolution` · `/immune` · `/analytics` · `/status` · `/earn`
- **AGENT** (7): `/autotrade` · `/builder` · `/developer` · `/nexus` · `/settings` · `/vault` · `/access`
- **ENACT** (3): `/enact` · `/jobs` · `/create`

### Кнопка ℹ (Info Modal)

На кожному пункті бокового меню є невидима кнопка `ℹ` (з'являється при наведенні):
- Натиск відкриває `InfoModal` з описом (`nav.*.desc`) і інструкцією (`nav.*.instr`)
- Закривається по Escape або кліку поза модалем

### Видимість меню (Creator control)

`Layout` фетчить `GET /api/creator/public-settings` (TanStack Query, staleTime 30s).
Якщо `navVisibility[href] === false` — пункт не рендериться в навігації.
Якщо група стала порожньою — заголовок групи теж зникає.

---

## Creator Page — Вкладки

| Вкладка | Що робить |
|---|---|
| **Панель** | KPI (юзери / дохід / вразливості / точність), 7-денний графік, стан циклів, активні підписники |
| **AI Інженер** | Чат з AI-асистентом: готує shell команди або API-запити, чекає підтвердження, виконує |
| **Налаштування** | Повне редагування `CreatorSettings`: ціни, auto-earn, цикли, адреса, привітання |
| **Меню** | **Видимість** кожного з 19 пунктів навігації + опис/інструкція для кожного |
| **Користувачі** | Таблиця всіх юзерів, видача планів вручну |
| **Термінал** | Shell-термінал прямо в браузері (виконує команди на сервері) |
| **Розсилка** | Telegram broadcast по планах (ELITE / PRO+ELITE / All active) |

### Вкладка «Меню» (детально)

- Показує всі 19 пунктів, згруповані по TITAN-94 / AGENT / ENACT
- Чекбокс = видимий / прихований для ВСІХ юзерів
- Статус-бейдж: зелений ON / червоний OFF
- Кнопка ℹ розкриває опис та інструкцію для кожного пункту
- «Увімкнути/Вимкнути групу» — масова зміна
- «Увімкнути всі» / «Вимкнути всі» — повний reset
- Лічильник: скільки з 19 зараз видимих
- Зберігається через `POST /api/creator/settings` → поле `navVisibility`
- Одразу інвалідує `["public-nav-settings"]` query → Layout оновлюється

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

### Creator (повний доступ)
```
GET  /api/creator/check/:tgId    (публічний)
GET  /api/creator/public-settings (публічний)
GET  /api/creator/settings        (creator only)
POST /api/creator/settings        (creator only)
POST /api/creator/settings/reset  (creator only)
GET  /api/creator/dashboard       (creator only)
GET  /api/creator/users           (creator only)
POST /api/creator/user/:id/grant  (creator only)
POST /api/creator/exec            (creator only)
POST /api/creator/ai/chat         (creator only)
POST /api/creator/ai/run          (creator only)
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
| `TELEGRAM_BOT_TOKEN_2` | Токен бота (окремий від API server) — **якщо не заданий, агент працює без бота (silent worker)** |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin chat ID для сповіщень |
| `TELEGRAM_REPORT_CHANNEL` | Канал для звітів |
| `GEMINI_API_KEY` | Google AI Studio |
| `TON_API_KEY` | toncenter.com (опційно) |
| `TONAPI_KEY` | tonapi.io (опційно) |
| `TON_MNEMONIC` | 24 слова мнемоніки (опційно, read-only без неї) |

> **ВАЖЛИВО — 409 conflict rule:** `TELEGRAM_BOT_TOKEN` — виключно для API сервера.
> Агент (agent.js) використовує `TELEGRAM_BOT_TOKEN_2` || `TELEGRAM_BOT_TOKEN_STANDALONE`.
> Якщо один токен використовують два polling-процеси — Telegram повертає 409.
> Правило: **один токен = один polling процес**.

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
- `tsc --noEmit` в `enact-dashboard` покаже помилки `@/` шляхів — це нормально, Vite резолвить їх сам. Довіряй `pnpm run typecheck`, не LSP.

---

## Важливі файли

| Файл | Призначення |
|---|---|
| `artifacts/api-server/src/index.ts` | Entry point, never-exit логіка |
| `artifacts/api-server/src/app.ts` | Express app + sentinel (armSentinel) |
| `artifacts/api-server/src/services/heartbeat.ts` | 4 цикли + auto-earn + ton-poller |
| `artifacts/api-server/src/services/store.ts` | Всі DB операції |
| `artifacts/api-server/src/services/creator.ts` | Creator settings (navVisibility, ціни, цикли) |
| `artifacts/api-server/src/services/sentinel.ts` | Process-level crash guard |
| `artifacts/api-server/src/routes/creator.ts` | Creator API + публічний /public-settings |
| `artifacts/api-server/src/lib/ton.ts` | TONAPI/TonCenter клієнт, fetchFactoryEvents |
| `artifacts/enact-dashboard/src/lib/ui-prefs.ts` | DICT перекладів (uk/en/ru), хуки теми/мови/TZ |
| `artifacts/enact-dashboard/src/lib/telegram.ts` | getTgUser(), isCreator(), haptic(), DEV ?_dev_tg |
| `artifacts/enact-dashboard/src/lib/tonconnect.ts` | buildPaymentTx(), RESERVE_WALLET, shortAddr(), formatTon() |
| `artifacts/api-server/src/services/binance.ts` | fetchPrices(), fetchBalance(), ping(), placeOrder() — HMAC-SHA256 |
| `artifacts/api-server/src/routes/binance.ts` | GET /binance/prices (public), /status /balance /order/test (creator) |
| `artifacts/enact-dashboard/src/pages/settings.tsx` | BinancePanel — live prices + spot balance + connection status |
| `artifacts/enact-dashboard/src/components/layout.tsx` | Sidebar, NAV_ITEMS (export), nav visibility, InfoModal |
| `artifacts/enact-dashboard/src/components/dev-mode.tsx` | DEV MODE банер (тільки поза Telegram) |
| `artifacts/enact-dashboard/src/components/splash.tsx` | Перший запуск — анімований splash (localStorage titan94.splash.seen) |
| `artifacts/enact-dashboard/src/pages/creator.tsx` | Creator panel (7 вкладок, Menu tab) |
| `artifacts/enact-dashboard/public/tonconnect-manifest.json` | TonConnect 2.0 manifest |
| `artifacts/enact-dashboard/public/tma-manifest.json` | Telegram Mini App manifest (Web App Schema) |
| `Titan_94_agent/agent.js` | Автономний агент, never-exit |
| `lib/db/src/schema.ts` | Drizzle ORM схема всіх 11 таблиць |
| `.titan-creator-settings.json` | Персистований JSON з CreatorSettings |

---

## TMA (Telegram Mini App) — Повний аудит

### `telegram.ts` — ядро інтеграції

**Місце:** `artifacts/enact-dashboard/src/lib/telegram.ts`

#### Ініціалізація (`initTelegram()`)

```
1. Перевіряє кеш → повертає cached якщо є
2. Читає URL параметр ?_dev_tg=<id> (DEV режим, тільки в браузері)
3. window.Telegram?.WebApp — реальний TMA SDK
4. wa.ready() + wa.expand() + wa.requestFullscreen() (TG 8.0+)
5. wa.setHeaderColor / setBackgroundColor / setBottomBarColor → #060F1A
6. wa.enableClosingConfirmation() + wa.disableVerticalSwipes()
7. Читає initDataUnsafe.user → TgUser { id, name, username, isReal: true }
8. Fallback → DEMO { id: "demo_user", isReal: false }
```

#### Кешування — ВАЖЛИВА ДЕТАЛЬ

```typescript
let cached: TgUser | null = null;  // модульний singleton
```

- Ініціалізується **один раз** при першому виклику `initTelegram()` або `getTgUser()`
- При SPA-навігації (wouter) кеш НЕ скидається → `getTgUser()` завжди повертає того ж юзера
- `useMemo(() => getTgUser(), [])` у компонентах — правильний патерн
- `?_dev_tg` читається тільки при **повному перезавантаженні** сторінки, не при навігації
- Саме тому `DevModeOverlay` і Vault використовують `window.location.href = ...` (hard reload) при зміні ролі

#### Функції TMA SDK

| Функція | WebApp API | Fallback |
|---|---|---|
| `haptic(kind)` | `HapticFeedback.notificationOccurred/impactOccurred` | тихо ігнорується |
| `showBackButton(handler)` | `BackButton.show/onClick/offClick/hide` | `() => {}` |
| `showMainButton(text, handler)` | `MainButton.setText/show/onClick` | `() => {}` |
| `cloudStorage.set/get/delete` | `CloudStorage.setItem/getItem/removeItem` | `false/null` |
| `openTelegramLink(url)` | `wa.openTelegramLink(url)` | `window.open(url, "_blank")` |
| `openLink(url)` | `wa.openLink(url, opts)` | `window.open(url, "_blank")` |
| `openInvoice(url, cb)` | `wa.openInvoice(url, cb)` | тихо |
| `shareToStory(mediaUrl)` | `wa.shareToStory(mediaUrl, opts)` | тихо |
| `getTgTheme()` | `wa.themeParams` | константи `#060F1A/#CFFFFF` |

#### Creator IDs (синхронізовано з бекендом)

```typescript
// frontend: artifacts/enact-dashboard/src/lib/telegram.ts
const CREATOR_IDS = new Set(["7255058720"]);

// backend: artifacts/api-server/src/services/creator.ts
const HARDCODED_CREATORS = ["7255058720"];
```

**Правило:** якщо додаєш нового creator — зміни в ОБОХ місцях.

#### `tgHeaders()` — авторизація API

Всі API-виклики, що потребують auth, мають передавати:
```typescript
import { tgHeaders } from "@/lib/telegram";
// headers: { "x-telegram-id": "...", "x-tg-init-data": "..." }
```

Бекенд перевіряє `x-telegram-id` для creator-endpoints. `x-tg-init-data` — для майбутньої HMAC-верифікації (поки не активована).

---

### TMA маніфест — `public/tma-manifest.json`

| Поле | Значення | Статус |
|---|---|---|
| `url` / `start_url` | `https://titan-94.replit.app/` | ✅ абсолютний |
| `icon` | `https://titan-94.replit.app/favicon.svg` | ✅ абсолютний |
| `screenshots[0].src` | `https://titan-94.replit.app/opengraph.jpg` | ✅ виправлено (було відносний `/opengraph.jpg`) |
| `ton_connect_manifest_url` | `https://titan-94.replit.app/tonconnect-manifest.json` | ✅ |
| `permissions` | telegram-mini-app, telegram-stars, ton-connect, haptic-feedback, cloud-storage, biometric-manager, main-button, back-button | ✅ |
| `developer.telegram_id` | `7255058720` | ✅ |

---

### Splash Screen — `components/splash.tsx`

- Показується **один раз** — зберігає `titan94.splash.seen` в localStorage
- `?splash=1` → примусовий показ; `?splash=0` → вимкнений
- Автоматично пропускається на `/settings`, `/protocol-94`, `/vault`, `/access`, `/creator`, `/developer`, `/builder`
- Auto-dismiss: 4.5s fade-out + 5.2s unmount

---

## TonConnect 2.0 — Повний аудит

### Архітектура

```
App.tsx
  └── TonConnectUIProvider (manifestUrl = window.origin + BASE + "/tonconnect-manifest.json")
        ├── earn.tsx — TON subscription payments (pro/elite)
        └── developer.tsx — arbitrary TON transactions
```

### `tonconnect.ts` — утиліти

**Місце:** `artifacts/enact-dashboard/src/lib/tonconnect.ts`

```typescript
export const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

export function buildPaymentTx(plan: "pro" | "elite", _telegramId: string): PaymentTx
// → { validUntil: now+600s, messages: [{ address: RESERVE_WALLET, amount: "5000000000" | "20000000000" }] }

export function formatTon(nano: string | number, decimals = 4): string
export function shortAddr(addr?: string | null, prefix = 6, suffix = 4): string
```

#### Дизайнове рішення: транзакція БЕЗ коментаря

```typescript
// payload навмисно опущений!
messages: [{ address: RESERVE_WALLET, amount: String(amount * 1e9) }]
```

**Чому:** TON Connect вимагає `payload` як base64-encoded BoC cell. Без спеціальної бібліотеки (`@ton/core`) генерація коректного BoC у браузері нетривіальна.

**Як бекенд ідентифікує платіж (ton-poller):**
1. Сканує вхідні tx Reserve wallet через TonCenter API
2. Збігає за парою `(from_address, amount_nano)`:
   - `5_000_000_000` → plan `pro`
   - `20_000_000_000` → plan `elite`
3. Фронт додатково надсилає `POST /api/webhook/ton-payment` з `{ telegramId, txHash, plan }` одразу після підписання tx
4. Бекенд верифікує txHash on-chain і активує план

**Ризик:** якщо юзер вручну надішле 5 TON на Reserve wallet — може збігтись. Низький ризик (потрібна точна сума + активний ton-poller).

**Наступний крок (TODO):** додати payload через `@ton/core` — comment = `TITAN94_<telegramId>_<plan>` для надійної ідентифікації.

### TonConnect маніфест — `public/tonconnect-manifest.json`

| Поле | Значення | Примітка |
|---|---|---|
| `url` | `https://titan-94.replit.app` | Базовий домен |
| `name` | `TITAN-94 ОКО НЕБЕСНЕ` | |
| `iconUrl` | `https://titan-94.replit.app/favicon.svg` | Абсолютний URL — обов'язковий для TonConnect |

**Критично:** `iconUrl` МАЄ бути абсолютним URL, інакше TonConnect відхиляє маніфест.

### `manifestUrl` в `App.tsx`

```typescript
// Завжди абсолютний URL — TonConnect відкидає відносні шляхи
const manifestUrl = typeof window !== "undefined"
  ? `${window.location.origin}${base}/tonconnect-manifest.json`
  : "/tonconnect-manifest.json";
```

SSR-fallback (`"/tonconnect-manifest.json"`) — безпечний, бо React рендеряться тільки в браузері.

### Платіжний флоу `earn.tsx`

```
1. getTgUser() → tg.id
2. useTonAddress() → підключена адреса гаманця
3. Вибір плану → кнопка "ПІДКЛЮЧИТИ ГАМАНЕЦЬ" → TonConnectButton (якщо не підключено)
4. Кнопка "ОПЛАТИТИ X TON" → sendTransaction(buildPaymentTx(plan, tg.id))
5. onSuccess → POST /api/webhook/ton-payment { telegramId, txHash, plan, walletAddress }
6. Хук usePoll("/billing/balance/tg.id", 10s) — автооновлення балансу
7. usePoll("/monetization/status/tg.id", 30s) — статус підписки
```

**RESERVE_WALLET** — єдиний в проєкті, імпортується з `tonconnect.ts` (раніше дублювався в `earn.tsx` — виправлено).

### Платіжний флоу `developer.tsx`

Аналогічна структура, але:
- Довільна сума (не фіксована)
- Адреса отримувача вводиться вручну або з конфігу
- Призначений для Creator/Developer testing

### `access.tsx` — сторінка тарифів (виправлено)

| Баг | Проблема | Виправлення |
|---|---|---|
| `/billing` route | Маршрут не існував в App.tsx | → `/earn?tier=<id>&mode=<mode>` |
| Root-relative URL | `window.location.href = '/billing?...'` ламається при BASE_PATH | → `BASE_URL + '/earn?...'` |
| Бот `Titan94Bot` | Неправильне ім'я бота (Stars payment deeplink) | → `Titan_94_agent_bot` |
| CTA `<Link href="/billing">` | Мертве посилання | → `<Link href="/earn">` |
| Bottom CTA Stars | `Titan94Bot?start=tiers` | → `Titan_94_agent_bot?start=tiers` |
| Stars yearly price | Фіксована кількість зірок незалежно від mode | → `mode === "yearly" ? Math.round(stars*12*0.8) : stars` |

---

## Бот Telegram — Правильні usernames

| Бот | Username | Призначення |
|---|---|---|
| Основний агент | `Titan_94_agent_bot` | Stars deeplinks, рефералки, команди |
| *(не існує)* | `Titan94Bot` | Не використовується — виправлено в access.tsx |

**Правило:** всі `t.me/` посилання використовують `Titan_94_agent_bot`.

---

## Splash пропускається (захард-кожено у `splash.tsx`)

```typescript
// Ці шляхи скіпають splash автоматично:
/(settings|protocol-94|vault|access|creator|developer|builder)/i
```

Тобто creator щоразу відкриває `/vault` або `/settings` — не побачить splash. Коректна поведінка.

---

## Vite конфіг — особливості

**Місце:** `artifacts/enact-dashboard/vite.config.ts`

- `PORT` — обов'язковий env var (кидає Error якщо немає)
- `BASE_PATH` — обов'язковий env var (кидає Error якщо немає)
- `server.allowedHosts: true` — Replit proxy (iframe) вимагає
- `server.proxy["/api"]` → `http://localhost:8080` — dev-only проксі до API сервера
- `resolve.alias["@"]` → `src/` — резолвиться Vite (не tsc)
- `resolve.dedupe: ["react", "react-dom"]` — уникнення подвійного React з TonConnect

**Важливо:** `tsc --noEmit` показує помилки `@/` імпортів — це хибні спрацювання. Vite резолвить їх сам через alias. Довіряй `pnpm run typecheck`, не LSP.

---

## Відомі обмеження / TODO

| # | Компонент | Опис |
|---|---|---|
| 1 | `tonconnect.ts` | `buildPaymentTx` не кодує BoC payload з коментарем. Матчинг платежу за `(address, amount)` — fragile. **TODO:** додати `@ton/core` comment cell |
| 2 | `developer.tsx` | Транзакція без on-chain comment — ідентифікація тільки через webhook |
| 3 | `telegram.ts` | HMAC-верифікація `x-tg-init-data` підготовлена (поле присутнє) але не активована на бекенді |
| 4 | `telegram.ts` | `requestFullscreen()` — TG 8.0+. Обгорнутий у try/catch, тихо ігнорується на старших версіях |
| 5 | `earn.tsx` | Після оплати через Stars (не TonConnect) — юзер перенаправляється у бот. Немає автоактивації з фронту — лише ton-poller або ручне видання |
