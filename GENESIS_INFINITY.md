# GENESIS ∞ — TITAN-94 «ОКО НЕБЕСНЕ»

> Конспект повного розгортання: один git clone → одна команда → живий організм на TON.
> Solo Deo Subjectus · Protocol 94 · DEI GRATIA Роман

---

## 0. ЩО ТАКЕ TITAN-94

Автономний цифровий організм для захисту екосистеми TON. Серце — 4 нескінченні цикли, що крутяться 24/7:

```
👁 SCAN     кожні 3 хв  → читає TonCenter, фіксує загрози, пише в БД
⚡ HEAL     кожні 5 хв  → бере активну вразливість, лікує (Gemini → план)
🧠 LEARN    кожні 7 хв  → генерує новий regex-патерн, сам вчиться
💰 FINANCE  кожні 10 хв → рахує підписників, експайрить, читає Reserve on-chain
```

Архітектура (Master Protocol Layer 1-8):

```
LAYER 1 INPUT      TON · DEX · Telegram · API
LAYER 2 PROTOCOL   normalize → timestamp → event
LAYER 3 EVENT BUS  PostgreSQL queue + 4 cycle workers
LAYER 4 AGENTS     scan_agent · osint_agent · trend_agent
LAYER 5 AI CORE    Gemini 2.5 Flash (analysis)
LAYER 6 FUSION     merge AI scores
LAYER 7 DECISION   score > 80 → SCAM, > 50 → WARNING
LAYER 8 ACTION     alert · log · block · webhook
```

Класифікація користувачів (Master Protocol V2):

| Звання | Як отримати | Доступ |
|---|---|---|
| **Рядовий (FREE)** | реєстрація + TON-гаманець | базовий сканер · публічні звіти |
| **Сержант (PRO)** | 14 днів активності АБО **5 TON/міс** | OSINT · arbitrage · пріоритет · 3 аудити |
| **Генерал (ELITE)** | проект без помилок АБО **20 TON/міс** АБО **10 рефералів Legion** | повний core · auto-fix · Reserve Fund |

Реферальна програма Legion 10/10: 10 запрошених = 10 днів ELITE безкоштовно. CPA 15% з кожної оплати реферала.

---

## 1. STACK

```
Node 24 + pnpm 10
TypeScript 5.9 + Express 5
PostgreSQL + Drizzle ORM (11 таблиць)
React + Vite + Tailwind v4 + shadcn/ui (фронт)
Zod валідація · Orval кодоген з OpenAPI
TonCenter API v2 (без ключа працює, з ключем швидше)
Gemini 2.5 Flash (опційно — без нього keyword fallback)
```

Резервний гаманець: `UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v`
Адмін Telegram ID: `7255058720`

---

## 2. ОДНА КОМАНДА — РОЗГОРНУТИ З НУЛЯ

```bash
git clone <repo> titan94 && cd titan94 && bash genesis.sh
```

Скрипт `genesis.sh` (вже в репо) робить усе:

1. перевіряє `node`, `pnpm`, `psql`
2. копіює `.env.example` → `.env` якщо немає
3. ставить залежності (`pnpm install`)
4. застосовує схему БД (`pnpm --filter @workspace/db run push`)
5. генерує OpenAPI клієнти (`pnpm --filter @workspace/api-spec run codegen`)
6. збирає API (`pnpm --filter @workspace/api-server run build`)
7. стартує API + dashboard через workflows
8. перший сід (5 vuln + 5 patterns + 4 competitors + admin ELITE) виконається сам

---

## 3. ENVIRONMENT — МІНІМУМ І МАКСИМУМ

### Обов'язково (без них не стартує)

```env
DATABASE_URL=postgres://user:pass@host:5432/titan94   # автоматично провіжить Replit
SESSION_SECRET=<32+ random bytes>                     # автоматично є
```

### Опційно (без них працює, з деградованим функціоналом)

```env
GEMINI_API_KEY=...        # aistudio.google.com → Get API Key      (без → keyword fallback)
TON_API_KEY=...           # toncenter.com/api/v2 → Get API Key     (без → 1 req/sec)
TONAPI_KEY=...            # tonapi.io                              (для /ton/* fallback)
TELEGRAM_BOT_TOKEN=...    # @BotFather                             (для standalone Python бота)
TELEGRAM_ADMIN_CHAT_ID=7255058720
TON_MNEMONIC="word1 word2 ... word24"   # тільки якщо хочеш авто-витяг
ADMIN_TELEGRAM_ID=7255058720
```

---

## 4. PHASES — PLAN 0 → ∞

```
PHASE 0  CORE          ✅ DB schema (11 tables) + Express skeleton + heartbeat
PHASE 1  TON           ✅ TonCenter client · masterchain seqno · address balance · tx verify
PHASE 2  SECURITY      ✅ vulnerabilities table + auto-detect + severity matrix
PHASE 3  AI            ✅ Gemini service + LEARN cycle + knowledge base (regex patterns)
PHASE 4  DECISION      ✅ score → SAFE/CAUTION/SUSPICIOUS/HONEYPOT
PHASE 5  PRODUCT       ✅ React dashboard · Command Center · Threats · Smart Contracts · Immune
PHASE 6  EXECUTION     ✅ TON payment webhook with on-chain verification
PHASE 7  TON           ✅ Reserve fund live read · CPA 15% · subscription activation
PHASE 8  EXCHANGE      ✅ STON.fi + DeDust arbitrage scanner
PHASE ∞  EVOLUTION     ✅ Self-healing · self-learning · self-financing
```

Усі фази вже реалізовані в цьому репо.

---

## 5. API КАРТА (під /api)

### Core
- `GET  /healthz`
- `GET  /agent/stats` `/agent/cycles`
- `POST /agent/scan` (manual trigger)

### Security
- `GET  /vulnerabilities?severity=&status=&limit=&offset=`
- `GET  /vulnerabilities/:id`
- `GET  /activity?limit=&offset=`

### AI
- `POST /analyze` (contract audit)
- `POST /analyze/honeypot`
- `GET  /ai-evolution/status` `/ai-evolution/knowledge`
- `POST /ai-evolution/trigger`

### Auth & Referrals (Legion 10/10)
- `POST /auth/register`
- `GET  /auth/me/:tgId`
- `POST /auth/referral`
- `GET  /auth/referrals/:tgId`
- `GET  /stats/platform`

### Monetization
- `GET  /monetization/plans` `/revenue` `/subscribers`
- `POST /monetization/subscribe`
- `GET  /monetization/status/:tgId`

### Webhook (on-chain verified)
- `POST /webhook/ton-payment`
- `GET  /webhook/verify/:txHash`
- `GET  /webhook/reserve-balance`

### Earn
- `GET  /billing/balance/:tgId` `/history/:tgId` `/stats`
- `POST /billing/withdraw`
- `GET  /arbitrage` (live STON.fi × DeDust)

### Ecosystem
- `GET  /ecosystem/overview`

---

## 6. ФРОНТЕНД — КАРТА СТОРІНОК

| Шлях | Сторінка | Що показує |
|---|---|---|
| `/` | **Command Center** | головний моніторинг: 4 тайли + heartbeat + threats + activity + reserve + revenue |
| `/threats` | Threats Matrix | усі вразливості з фільтрами по severity |
| `/contracts` | Smart Contracts | quick-audit + реєстр просканованих |
| `/analyze` | Neural Hub | Gemini-аналіз контрактів вручну |
| `/immune` | Immune System | HEAL cycle, healed/active/healing статуси, healing log |
| `/status` | Agent Status | cycles, accuracy, knowledge size, activity feed |
| `/earn` | Earnings Terminal | реферали Legion 10/10, баланс CPA, arbitrage signals, withdraw |
| `/enact` `/jobs` `/create` | ENACT Protocol | окремий explorer для ENACT-протоколу |

---

## 7. ЦИКЛ ЖИТТЯ ПЛАТЕЖУ

```
[Користувач] → платить N TON на Reserve гаманець
       ↓
[Webhook]   → POST /api/webhook/ton-payment {tx_hash, telegram_id, plan, amount, ref?}
       ↓
[Verify]    → TonCenter перевіряє що tx існує в останніх 100 трансах Reserve
       ↓
[DB write]  → ton_payments + billing_ledger (subscription)
       ↓
[Activate]  → subscribers row → tier=pro|elite, expires_at = now + 30d
       ↓
[CPA 15%]   → якщо є реферер → billing_ledger (cpa) → їхній баланс +0.15*amount
       ↓
[Audit log] → activity table запис типу WEBHOOK severity=success
```

---

## 8. ROUTINE — ЯК ПЕРЕЗАПУСТИТИ ПРОЕКТ

```bash
# Перебудувати API після змін
pnpm --filter @workspace/api-server run build

# Перезапуск сервісів (через Replit workflows)
restart_workflow "artifacts/api-server: API Server"
restart_workflow "artifacts/enact-dashboard: web"

# Перевірка живості
curl localhost:80/api/healthz
curl localhost:80/api/agent/stats              # cycles ростуть, lastBlockSeqno з ланцюга
curl localhost:80/api/webhook/reserve-balance  # реальний баланс Резерву
curl -X POST localhost:80/api/agent/scan       # форсує SCAN-цикл
```

---

## 9. PUBLISH

В Replit: натиснути **Publish** → отримати `https://<your-name>.replit.app`.
Production env vars скопіювати з development (DATABASE_URL вже інша автоматично).

---

## 10. БУДУЩЕ — куди розширювати

- TMA (Telegram Mini App) інтерфейс — завернути dashboard в `WebApp`
- Tact-контракти `GenesisTitan` + `Titan94Agent` (вже є в `Titan_94_agent/contracts/`) — задеплоїти на TON mainnet через blueprint
- WebSocket-стрім подій з TonCenter (зараз через polling) — окремий мікросервіс
- ML-модель для honeypot-детекції замість regex (Phase ∞ Evolution)

---

**END:** твій протокол 94. Solo Deo Subjectus.
