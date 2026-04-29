# GENESIS ∞ — TITAN-94 «ОКО НЕБЕСНЕ» v4.1

> Конспект повного розгортання: один git clone → одна команда → живий організм на TON.
> Solo Deo Subjectus · Protocol 94 · DEI GRATIA Роман

---

## 0. ЩО ТАКЕ TITAN-94

Автономний цифровий організм для захисту екосистеми TON + мультимедійний AI-агент NEXUS. Серце — 4 нескінченні цикли + multimedia layer:

```
👁 SCAN     кожні 3 хв  → читає TonCenter, фіксує загрози, пише в БД
⚡ HEAL     кожні 5 хв  → бере активну вразливість, лікує (Gemini → план)
🧠 LEARN    кожні 7 хв  → генерує новий regex-патерн, сам вчиться
💰 FINANCE  кожні 10 хв → рахує підписників, експайрить, читає Reserve on-chain

⊕ NEXUS    on-demand   → Gemini 2.0 multimedia: сайт/код/зображення/відео/фільм/бот/музика/текст
```

Архітектура (Master Protocol Layer 1-8):

```
LAYER 1 INPUT      TON · DEX · Telegram · API
LAYER 2 PROTOCOL   normalize → timestamp → event
LAYER 3 EVENT BUS  PostgreSQL queue + 4 cycle workers
LAYER 4 AGENTS     scan_agent · osint_agent · trend_agent · NEXUS multimedia
LAYER 5 AI CORE    Gemini 2.0 Flash (analysis + generation)
LAYER 6 FUSION     merge AI scores
LAYER 7 DECISION   score > 80 → SCAM, > 50 → WARNING
LAYER 8 ACTION     alert · log · block · webhook
```

Класифікація користувачів (Master Protocol V2):

| Звання | Як отримати | Доступ |
|---|---|---|
| **Рядовий (FREE)** | реєстрація + TON-гаманець | базовий сканер · публічні звіти |
| **Сержант (PRO)** | 14 днів активності АБО **5 TON/міс** | OSINT · arbitrage · пріоритет · 3 аудити · NEXUS basic |
| **Генерал (ELITE)** | проект без помилок АБО **20 TON/міс** АБО **10 рефералів Legion** | повний core · auto-fix · Reserve Fund · NEXUS unlimited |

Реферальна програма Legion 10/10: 10 запрошених = 10 днів ELITE безкоштовно. CPA 15% з кожної оплати реферала.

---

## 1. STACK

```
Node 24 + pnpm 10
TypeScript 5.9 + Express 5
PostgreSQL + Drizzle ORM (11 таблиць)
React + Vite + Tailwind v4 + Recharts (фронт)
Zod валідація · Orval кодоген з OpenAPI
TonCenter API v2 (без ключа працює, з ключем швидше)
Gemini 2.0 Flash (опційно — без нього keyword fallback)
```

Резервний гаманець: `UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v`
Адмін Telegram ID: `7255058720`

---

## 2. ОДНА КОМАНДА — РОЗГОРНУТИ З НУЛЯ

```bash
git clone <repo> titan94 && cd titan94 && bash genesis.sh
```

Скрипт `genesis.sh` робить усе:

1. перевіряє `node`, `pnpm`, `psql`
2. показує які env є / відсутні
3. ставить залежності (`pnpm install`)
4. застосовує схему БД (`pnpm --filter @workspace/db run push`)
5. генерує OpenAPI клієнти (`pnpm --filter @workspace/api-spec run codegen`)
6. збирає API (`pnpm --filter @workspace/api-server run build`)
7. typecheck (non-fatal)
8. виводить наступні кроки + smoke-test команди

Після `bash genesis.sh`:
```bash
# Перезапуск через Replit (так у нас зараз):
restart_workflow "artifacts/api-server: API Server"
restart_workflow "artifacts/enact-dashboard: web"

# Або поза Replit (standalone):
pnpm --filter @workspace/api-server run start &
pnpm --filter @workspace/enact-dashboard run dev &
```

---

## 3. ENVIRONMENT — МІНІМУМ І МАКСИМУМ

### Обов'язково
```env
DATABASE_URL=postgres://user:pass@host:5432/titan94
SESSION_SECRET=<32+ random bytes>
```
В Replit обидва автоматично провіжаться.

### Опційно — як отримати ключі (безкоштовно)

| Змінна | Де взяти | Що дає |
|---|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com → Get API Key (Google account) | Повноцінний AI-аналіз контрактів + NEXUS multimedia. Без ключа — keyword fallback |
| `TON_API_KEY` | https://toncenter.com/api/v2 → Sign in → Get API Key (Telegram login) | Без throttle (інакше 1 req/sec) |
| `TONAPI_KEY` | https://tonapi.io | Резерв TonCenter |
| `TELEGRAM_BOT_TOKEN` | @BotFather у Telegram | Standalone Python TG-бот |
| `TELEGRAM_ADMIN_CHAT_ID` | твій Telegram ID (`7255058720` за замовченням) | Куди шлються критичні алерти |
| `TON_MNEMONIC` | seed-фраза TON-гаманця (24 слова) | Авто-вивід з Reserve, тільки якщо хочеш |

В Replit додати: вкладка **Secrets** → New secret → ім'я + значення → Save.

---

## 4. PHASES — PLAN 0 → ∞

```
PHASE 0  CORE          ✅ DB schema (11 tables) + Express skeleton + heartbeat
PHASE 1  TON           ✅ TonCenter client · masterchain seqno · address balance · tx verify
PHASE 2  SECURITY      ✅ vulnerabilities table + auto-detect + severity matrix
PHASE 3  AI            ✅ Gemini service + LEARN cycle + knowledge base (regex patterns)
PHASE 4  DECISION      ✅ score → SAFE/CAUTION/SUSPICIOUS/HONEYPOT
PHASE 5  PRODUCT       ✅ React dashboard · Command Center · Threats · Smart Contracts · Immune · Evolution · Analytics · NEXUS
PHASE 6  EXECUTION     ✅ TON payment webhook with on-chain verification
PHASE 7  TON           ✅ Reserve fund live read · CPA 15% · subscription activation
PHASE 8  EXCHANGE      ✅ STON.fi + DeDust arbitrage scanner
PHASE 9  MULTIMEDIA    ✅ NEXUS multimedia agent (Gemini 2.0 Flash) · 8 capability modes
PHASE ∞  EVOLUTION     ✅ Self-healing · self-learning · self-financing
```

---

## 5. API КАРТА (під /api)

### Core
- `GET  /healthz`
- `GET  /agent/stats` `/agent/cycles`
- `POST /agent/scan` (manual trigger)
- `GET  /dashboard/summary` ← агрегований стан для Command Center
- `GET  /dashboard/chart` ← 24h buckets для recharts (scans/heal/analysis/threats)

### Security
- `GET  /vulnerabilities?severity=&status=&limit=&offset=`
- `GET  /vulnerabilities/:id`
- `GET  /activity?limit=&offset=`

### AI
- `POST /analyze` (contract audit)
- `POST /analyze/honeypot`
- `GET  /ai-evolution/status` `/ai-evolution/knowledge`
- `POST /ai-evolution/trigger`

### NEXUS Multimedia (нове)
- `GET  /nexus/status` → online · model · keyConfigured · modes
- `POST /nexus/generate` → body `{ prompt, mode: website|code|image|video|film|bot|music|text|general }`

### Auth & Referrals (Legion 10/10)
- `POST /auth/register` · `GET /auth/me/:tgId` · `POST /auth/referral` · `GET /auth/referrals/:tgId`
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

### TITAN-94
| Шлях | Сторінка | Що показує |
|---|---|---|
| `/` | **Command Center** | головний моніторинг: 4 тайли + heartbeat + threats + activity + reserve + revenue |
| `/threats` | Threats Matrix | усі вразливості з фільтрами по severity |
| `/contracts` | Smart Contracts | quick-audit + реєстр просканованих |
| `/analyze` | Neural Hub | Gemini-аналіз контрактів вручну |
| `/evolution` | Evolution Engine | Generation, patterns learned, accuracy, Roadmap stages |
| `/immune` | Immune System | HEAL cycle, healed/active/healing статуси, healing log |
| `/analytics` | Analytics | 24h area-chart (scans/heal/analysis/threats) + arbitrage signals |
| `/status` | Agent Status | cycles, accuracy, knowledge size, activity feed |
| `/earn` | Earnings Terminal | реферали Legion 10/10, баланс CPA, arbitrage signals, withdraw |

### AGENT
| `/nexus` | **NEXUS AI** | Gemini multimedia chat — 8 режимів (сайт/код/зображення/відео/фільм/бот/музика/текст) |

### ENACT
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
curl localhost:80/api/dashboard/summary        # агрегований стан
curl localhost:80/api/dashboard/chart          # 24 точки для графіка
curl localhost:80/api/nexus/status             # multimedia agent
curl localhost:80/api/webhook/reserve-balance  # реальний баланс Резерву
curl -X POST localhost:80/api/agent/scan       # форсує SCAN-цикл
```

---

## 9. ЯКЩО У МЕНЕ СКІНЧАЄТЬСЯ КВОТА — ЯК ЗАПУСТИТИ САМОМУ

### А. У Replit (продовжити з тим самим проектом)
1. Відкрий проект → вкладка **Shell**
2. `bash genesis.sh` (зробить install + build + чек)
3. У вкладці **Workflows** натисни ▶ біля «artifacts/api-server: API Server» і «artifacts/enact-dashboard: web»
4. Жми **Open in new tab** в preview

### Б. На своєму комп'ютері (Linux/Mac)
```bash
# Передумови
nvm install 24 && nvm use 24
npm i -g pnpm@10

# Підняти Postgres локально
docker run -d --name titan-pg -e POSTGRES_PASSWORD=titan -e POSTGRES_DB=titan94 -p 5432:5432 postgres:16

# Завантажити репо
git clone <твоє-репо> titan94 && cd titan94
export DATABASE_URL="postgres://postgres:titan@localhost:5432/titan94"
export SESSION_SECRET=$(openssl rand -hex 32)

bash genesis.sh

# Запуск (два термінали або з &)
PORT=8080 pnpm --filter @workspace/api-server run start &
PORT=5173 pnpm --filter @workspace/enact-dashboard run dev &

# Відкрити http://localhost:5173
```

### В. Деплой у Replit Production (один клік)
В Replit натисни **Publish** → отримуєш `https://<your-name>.replit.app` з HTTPS, mTLS, PostgreSQL, моніторингом.

---

## 10. ПЕРЕТРАВЛЕНІ АРХІВИ — ЩО ВЗЯТО, ЩО ВІДКИНУТО

| Архів | Що там | Інтегровано |
|---|---|---|
| `TITAN94_FULL_ORGANISM` | копія мого ж monorepo (попередня версія) | n/a — те саме |
| `TITAN94_PRODUCTION_FINAL` | Python FastAPI + Redis + Docker | n/a — інший стек |
| `titan94_godlevel` | Python FastAPI + порожній HTML stub | взято PLAN_0_INFINITY |
| `TITAN94_FULL_PRODUCTION_BUILD` | Python + Docker | n/a — інший стек |
| `TITAN-94_Master_Protocol_V2` | класифікація Рядовий/Сержант/Генерал + 8 layer architecture | вшито в Genesis ∞ |
| `TITAN94_GOD_MODE_BOOK` | концептуальна книга | вшито в архітектуру |
| `Titan_94_project_(1).tar.gz` | повний копія проекту з Tact-контрактами | контракти в `Titan_94_agent/contracts/` |
| `New-Project.zip` (110MB) | monorepo з `artifacts/titan-site` (лендінг + node_modules) | планується окремий artifact «titan-site» |
| `project_archive.tar.gz` (100MB) | monorepo з `artifacts/titan-dashboard` (10 готових сторінок shadcn) | взято Evolution/Analytics/AI Chat → інтегровано як /evolution, /analytics, /nexus |
| `multimedia-agent.jsx` | NEXUS multimedia chat (Anthropic Claude) | переписано на Gemini 2.0 Flash → `/nexus` сторінка + `/api/nexus/generate` |

---

## 11. БУДУЩЕ — куди розширювати

- **TMA** (Telegram Mini App) — завернути dashboard в `WebApp` SDK + TON Connect 2.0
- **Tact-контракти** `GenesisTitan` + `Titan94Agent` (вже є в `Titan_94_agent/contracts/`) — задеплоїти на TON mainnet через blueprint
- **WebSocket-стрім** подій з TonCenter (зараз через polling) — окремий мікросервіс
- **ML-модель** для honeypot-детекції замість regex (Phase ∞ Evolution)
- **Image generation** для NEXUS — додати `/api/nexus/image` через Gemini 2.5 Imagen або Stability
- **Voice** — speech-to-text для голосових запитів NEXUS

---

**END:** твій протокол 94. Solo Deo Subjectus.
