# TITAN-94 «ОКО НЕБЕСНЕ» — ЄДИНИЙ МАЙСТЕР-КОНСПЕКТ

> **Власник:** @Cryptoagentton · infantryman · DEI GRATIA Роман  
> **Місія:** Автономний AI-організм безпеки TON блокчейну і Telegram екосистеми  
> **Версія:** 5.0-OMNIPOTENT | **Дата:** Квітень 2026 | HataCon 2 · tapps.center  
> **Мотто:** *Solo Deo Subjectus · In Deo Infiniti Sumus*

---

## 🧬 СУТЬ ПРОЕКТУ

TITAN-94 — це **суверенна цифрова фінансова екосистема**:
- 👁️ **Сканує** TON блокчейн — знаходить вразливості до зловмисників
- ⚡ **Лікує** — Gemini AI генерує плани виправлення автономно
- 🛡️ **Захищає** Telegram — скам-детектор, HoneyPot, модератор
- 💰 **Заробляє** — підписки + арбітраж + bounty + реферали + CPA
- 🧠 **Розвивається** — щогодини навчається новим паттернам загроз
- ♾️ **Безсмертний** — самолікується при будь-якому збої

---

## 🏗️ АРХІТЕКТУРА

```
╔══════════════════════════════════════════════════════════════╗
║                    TITAN-94 / ОКО НЕБЕСНЕ                    ║
╠══════════════════════════════════════════════════════════════╣
║  @Titan_94_agent_bot (Telegram Bot)                          ║
║  ├── /start /scan /analyze /honeypot /threats /market        ║
║  └── Будь-який текст → Gemini AI асистент                    ║
║                         ↕                                    ║
║  React Dashboard (TMA + Web)                                 ║
║  STATUS · THREATS · NEURAL · MARKET · EARN · RESERVE         ║
║                         ↕                                    ║
║  Express API :8080                                           ║
║  ├── Heartbeat: SCAN/HEAL/LEARN/FINANCE                      ║
║  ├── 25+ REST endpoints                                      ║
║  └── Sentinel: HMAC + rate limit + anomaly                   ║
║                         ↕                                    ║
║  PostgreSQL (7 таблиць) + In-memory state                    ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📁 СТРУКТУРА ФАЙЛІВ

```
workspace/
├── artifacts/api-server/src/
│   ├── index.ts                  ✅ startHeartbeat() при старті
│   ├── services/heartbeat.ts     ✅ SCAN/HEAL/LEARN/FINANCE + seed
│   └── routes/
│       ├── health.ts             ✅ GET /api/healthz
│       ├── agent.ts              ✅ GET /api/agent/stats|cycles
│       ├── jobs.ts               ✅ ENACT jobs
│       ├── stats.ts              ✅ ENACT stats
│       ├── arbitrage.ts          ✅ GET /api/arbitrage
│       ├── referral.ts           ✅ /api/auth/* + CPA 15%
│       ├── billing.ts            ✅ GET/POST /api/billing/*
│       ├── analyze.ts            ✅ POST /api/analyze + honeypot
│       ├── vulnerabilities.ts    ✅ GET /api/vulnerabilities
│       ├── activity.ts           ✅ GET /api/activity
│       ├── monetization.ts       ✅ /api/monetization/*
│       ├── ton-routes.ts         ✅ /api/ton/*
│       └── ai-evolution.ts       ✅ /api/ai-evolution/*
│
├── artifacts/enact-dashboard/src/pages/
│   ├── home.tsx                  ✅ ENACT overview
│   ├── jobs.tsx                  ✅ Job explorer
│   ├── job-detail.tsx            ✅ Job detail
│   ├── create-job.tsx            ✅ Create + Tonkeeper
│   ├── earn.tsx                  ✅ EARN — рефери + арбітраж + sniper
│   ├── status.tsx                ✅ Agent status + cycles
│   ├── threats.tsx               ✅ Vulnerabilities table
│   └── analyze.tsx               ✅ AI аналіз + HoneyPot
│
├── lib/db/src/schema/index.ts    ✅ 7 таблиць
├── Titan_94_agent/agent.js       ✅ Автономний агент
└── bot/main.py                   ✅ Python Telegram bot
```

---

## 🔐 СЕКРЕТИ (Replit → Secrets)

| Змінна | Де взяти | Важливість |
|--------|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | @BotFather → @Titan_94_agent_bot | 🔴 КРИТИЧНО |
| `GEMINI_API_KEY` | aistudio.google.com | 🔴 КРИТИЧНО |
| `DATABASE_URL` | Replit PostgreSQL (авто) | 🟡 Є |
| `ADMIN_TELEGRAM_ID` | `7255058720` | 🟠 ВАЖЛИВО |
| `TON_API_KEY` | toncenter.com | 🟢 ОПЦІЙНО |
| `TONAPI_KEY` | tonapi.io | 🟢 ОПЦІЙНО |
| `TON_MNEMONIC` | Гаманець 24 слова | 🟢 ОПЦІЙНО |
| `SESSION_SECRET` | будь-які 32+ символи | 🟡 Є |

---

## 💓 HEARTBEAT — 4 АВТОНОМНИХ ЦИКЛИ

| Цикл | Інтервал | Що робить |
|------|----------|-----------|
| 👁️ SCAN | кожні 3 хв | TON блок, нові контракти, аномалії → activity log |
| ⚡ HEAL | кожні 5 хв | Gemini AI генерує healing plan для активних загроз |
| 🧠 LEARN | кожні 7 хв | Новий паттерн → knowledge base → accuracy++ |
| 💰 FINANCE | кожні 10 хв | Перевірка підписок, revenue stats |

---

## 🌐 ПОВНИЙ API (25+ ENDPOINTS)

### Core
| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/healthz` | Health check |
| GET | `/api/agent/stats` | Статистика агента |
| GET | `/api/agent/cycles` | Статус heartbeat циклів |
| POST | `/api/agent/scan` | Ручний тригер сканування |

### Security
| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/analyze` | Gemini AI аналіз контракту |
| POST | `/api/analyze/honeypot` | HoneyPot детектор |
| GET | `/api/vulnerabilities` | Список вразливостей |
| GET | `/api/activity` | Activity feed |

### Finance & Earn
| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/arbitrage` | DEX арбітраж (STON.fi + DeDust) |
| GET | `/api/arbitrage/prices` | Поточні ціни |
| GET | `/api/monetization/plans` | Плани FREE/PRO/ELITE |
| GET | `/api/monetization/status/:id` | Статус підписки |
| POST | `/api/monetization/subscribe` | Підписатись |
| GET | `/api/monetization/revenue` | Revenue stats |
| POST | `/api/monetization/webhook/ton-payment` | TON оплата webhook |

### Referral & Billing (НОВЕ)
| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/auth/register` | Реєстрація + 72h trial |
| GET | `/api/auth/me/:id` | Статус юзера |
| POST | `/api/auth/referral` | Трекінг реферала |
| GET | `/api/auth/referrals/:id` | Список рефералів |
| GET | `/api/billing/balance/:id` | Баланс реферальних TON |
| POST | `/api/billing/withdraw` | Вивід реферальних TON |
| GET | `/api/billing/history/:id` | Історія транзакцій |

### TON & AI
| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/ton/network` | TON мережа stats |
| GET | `/api/ton/wallet` | Reserve Fund баланс |
| GET | `/api/ton/contract/:addr` | Інфо контракту |
| GET | `/api/ai-evolution/status` | AI еволюція |
| GET | `/api/ai-evolution/knowledge` | Knowledge base |
| GET | `/api/stats/platform` | Платформна статистика |

---

## 💰 ПОВНА СИСТЕМА МОНЕТИЗАЦІЇ

### Підписки
```
FREE   → 0 TON/міс  | 5 scans/day, базові алерти
PRO    → 5 TON/міс  | Unlimited, AI аналіз, HoneyPot, alerts
ELITE  → 20 TON/міс | Все + арбітраж, Sniper, Copy-Trading, API
```

### 1. Реферальна програма «Legion 10/10» ✅
- **Унікальне посилання:** `t.me/Titan_94_agent_bot?start=ref{TELEGRAM_ID}`
- **10 за 10:** Привів 10 друзів з підключеним гаманцем → 10 днів ELITE (~7 TON вартість)
- **CPA 15%:** Реферал купує PRO/ELITE → 15% суми миттєво на баланс запрошувача
- **Для новачків:** 72h Free Trial → 3 безкоштовних аудити → звикають → платять
- **Вивід:** `POST /api/billing/withdraw` → TON на гаманець

### 2. «Sniper Alert» — Ранній доступ ✅
- TITAN-94 сканує нові контракти (через SCAN цикл)
- ELITE юзери: сповіщення через 10 сек після появи нового токену
- Якщо TITAN-94 ставить «SAFE» → юзер купує першим
- **Твій дохід:** 1% комісія з транзакцій через інтерфейс

### 3. «Copy-Trading Smart Wallets» (Mirror Mode) 🔄
- SCAN цикл знаходить гаманці з 80%+ прибуткових угод
- ELITE + Mirror Mode (+2 TON/міс) → автокопіювання угод
- **API:** `GET /api/ton/smart-wallets` → список Smart Money гаманців

### 4. «API-as-a-Service» (B2B) ✅
- Доступ до `/api/analyze` для зовнішніх розробників
- 100 TON за 10,000 запитів → API ключ у headers
- Rate limit: 10 req/min для FREE API tier

### 5. «Premium Audit PDF» 🔄
- Gemini 2.5 Pro генерує повний PDF звіт
- Печатка «TITAN SECURED» + підпис
- 5 TON за один контракт
- **API:** `POST /api/analyze/audit-report`

### 6. «Safe Swap» Insurance Fund ✅
- 0.1 TON мікро-комісія за кожну перевірену угоду
- Якщо TITAN сказав «SAFE», а скам → компенсація з Reserve Fund
- Будує репутацію найбезпечнішого сервісу TON

### Reserve Fund Wallet
`UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v`

### Webhook TON оплата
```
POST /api/monetization/webhook/ton-payment
{ "txHash": "...", "fromAddress": "EQ...", "amountNano": "5000000000" }
4.5–5.5 TON → PRO (30 днів) | 19–21 TON → ELITE (30 днів)
```

---

## 🗄️ БАЗА ДАНИХ (7 таблиць)

```sql
vulnerabilities: id, external_id, title, severity, protocol,
                 contract_address, tvl_at_risk, status,
                 category, healing_plan, discovered_at, healed_at

activity:        id, type, title, message, severity, metadata, created_at

competitors:     id, name, description, tvl, chain, threat_level, website

knowledge:       id, category, pattern, description, confidence,
                 occurrences, source, created_at

subscribers:     id, telegram_id, username, plan, ton_address,
                 expires_at, is_active, referred_by, cpa_balance

agent_state:     id, cycles, healing_cycles, learn_cycles, finance_cycles,
                 accuracy, threats_healed, knowledge_size, updated_at

blocked_addresses: id, address, reason, severity, source
```

### Додатково: Таблиця referrals (in-memory для hackathon)
```
referrals: referrer_id → [referred_ids]
billing:   telegram_id → { balance_ton, history: [{type, amount, ts}] }
```

---

## 🤖 TELEGRAM BOT — КОМАНДИ

```
/start        → Меню + Reserve гаманець + реферальне посилання
/stats        → Статистика TITAN-94 + accuracy
/scan         → Запустити сканування
/analyze EQ…  → Gemini AI аналіз контракту
/honeypot EQ… → HoneyPot детектор
/threats      → ТОП-5 активних загроз
/market       → Арбітраж + схеми заробітку
/wallet       → Reserve Fund баланс
/earn         → Баланс рефералів + CPA нарахування
/heal         → Healing план від Gemini
<будь-який текст> → AI асистент
```

---

## 🎨 ДИЗАЙН — КІБЕРПАНК

```css
--background: #030D18    /* темно-синій космос */
--card:       #060F1A    /* карти */
--primary:    #00FFFF    /* cyan — акцент */
--foreground: #CFFFFF    /* текст */
--safe:       #00FF88    /* зелений — heal/success */
--danger:     #FF3355    /* червоний — критично */
--amber:      #FF8C00    /* арбітраж/попередження */
--border:     rgba(0,255,255,0.2)
font: 'Space Mono', monospace
border-radius: 0px  /* гострі кути */
```

---

## 🎮 UX АНІМАЦІЯ — КУБИК РУБІКА (AnalyzePage)

| Фаза | Прогрес | Символіка |
|------|---------|-----------|
| Хаос | 0–30% | Парсинг сирих даних |
| Пошук | 30–80% | Порівняння з knowledge base |
| Синтез | 80–99% | Генерація звіту |
| Тріумф | 100% | Зелений спалах #00FF88 ✅ |

---

## 🛡️ SENTINEL СИСТЕМА

| Рівень | Механізм | Дія |
|--------|----------|-----|
| 1 | HMAC-SHA256 Telegram initData | 401 для підроблених |
| 2 | Rate Limit 120 req/год | Блок + alert |
| 3 | Anomaly Detector SQL/XSS/LFI | Миттєвий блок |
| 4 | TON multi-node fallback | Резервний вузол |
| 5 | Gemini Pro→Flash fallback | Авто при помилці |
| 6 | uncaughtException handler | Self-heal + лог |

---

## 📊 ІДЕНТИФІКАЦІЙНІ ДАНІ

```
Проект:    TITAN-94 «ОКО НЕБЕСНЕ»
Власник:   @Cryptoagentton · infantryman · DEI GRATIA Роман
Бот:       @Titan_94_agent_bot (ID: 8695471318)
Admin TG:  7255058720
Wallet:    UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v
Domain:    wilted-familiar-cable--titangenesis94.replit.app
Hackathon: HataCon 2 · identityhub.app · tapps.center
AI:        Gemini 2.0 Flash + 2.5 Pro
Stack:     Node.js 20 + React 18 + PostgreSQL + Python 3.11
```

---

## 🚀 ДОРОЖНЯ КАРТА

### ✅ Фаза 1 — ПОВНІСТЮ ЗБУДОВАНО (сесія Квітень 2026)

#### Backend (api-server :8080)
- [x] **DB Schema** — 7 таблиць (Drizzle ORM + pgEnum)
- [x] **Heartbeat** — SCAN(3хв)/HEAL(5хв)/LEARN(7хв)/FINANCE(10хв) + seed data
- [x] **startHeartbeat()** у index.ts — автостарт
- [x] **GET /api/agent/stats** — повна статистика агента v4.0-OMNIPOTENT
- [x] **GET /api/agent/cycles** — live статус 4 циклів
- [x] **POST /api/agent/scan** — ручний тригер
- [x] **POST /api/analyze** — Gemini AI аудит контракту + keyword fallback
- [x] **POST /api/analyze/honeypot** — HoneyPot детектор
- [x] **GET /api/vulnerabilities** — список з фільтрами + stats (TVL at risk)
- [x] **GET /api/activity** — activity feed
- [x] **GET /api/arbitrage** — DEX сигнали (STON.fi + DeDust)
- [x] **GET /api/monetization/plans** — FREE/PRO(5TON)/ELITE(20TON)
- [x] **POST /api/monetization/webhook/ton-payment** — авто PRO/ELITE
- [x] **POST /api/auth/register** — реєстрація + 72h trial
- [x] **GET /api/auth/referrals/:id** — список рефералів + Legion progress
- [x] **GET /api/billing/balance/:id** — реферальний баланс TON
- [x] **POST /api/billing/withdraw** — вивід CPA на TON гаманець
- [x] **GET /api/ton/wallet** — Reserve Fund баланс
- [x] **GET /api/ton/smart-wallets** — Smart Money гаманці (Mirror Mode)
- [x] **GET /api/ai-evolution/status** — AI еволюція + accuracy
- [x] **GET /api/ai-evolution/knowledge** — knowledge base patterns
- [x] **GET /api/ecosystem/overview** — огляд екосистеми
- [x] **CPA 15%** — creditCPA() при кожній оплаті реферала
- [x] **Vite proxy** — `/api/*` → `http://localhost:8080/api/*`

#### Frontend (enact-dashboard)
- [x] **Кіберпанк CSS** — Space Mono, #030D18, #00FFFF, #00FF88, #FF3355, 0px radius, CRT scanline
- [x] **Sidebar** — TITAN-94 ● LIVE, роздільні секції ENACT / TITAN-94
- [x] **Agent Status** — stats, 4 cycles cards, activity feed, SCAN кнопка
- [x] **Threats Matrix** — таблиця вразливостей, фільтри, TVL at risk, healing plan
- [x] **Neural Analysis** — CONTRACT AUDIT / HONEYPOT CHECK режими, progress animation
- [x] **Earn Terminal** — баланс CPA, Legion 10/10 progress, referral link copy, arbitrage signals, Sniper locked
- [x] **App.tsx** — 8 роутів підключено

#### Agents & Bot
- [x] **Titan_94_agent/agent.js** — GeminiCore + TonScanner + BugBounty + TelegramAgent + AutonomousLoop
- [x] **bot/main.py** — Python bot: /start /stats /scan /analyze /honeypot /threats /market /earn /heal + AI fallback

### 🔄 Фаза 2 — Ecosystem Presence
- [ ] Lottie Rubik's Cube анімація (AnalyzePage)
- [ ] TonConnect UI у дашборді
- [ ] tapps.center публікація + submission
- [ ] Safe Swap Insurance (0.1 TON комісія)
- [ ] Premium Audit PDF (Gemini 2.5 Pro → PDF)
- [ ] Mirror Mode Copy-Trading (ELITE+2TON)
- [ ] TON DNS — `titan94.ton`

### 💎 Фаза 3 — Economic Autonomy
- [ ] Автовиконання арбітражу (STON.fi SDK)
- [ ] API-as-a-Service billing (100 TON/10k req)
- [ ] pgvector векторна пам'ять
- [ ] Cross-chain моніторинг (ETH/BSC/SOL)
- [ ] Голосовий інтерфейс (Whisper STT → Gemini → TTS)

---

## 🔧 ЗАПУСК

```bash
# Залежності
pnpm install
cd Titan_94_agent && npm install

# Workflows вже налаштовані:
# "API Server"          → api-server :8080
# "enact-dashboard: web"→ dashboard (динамічний порт)
# "Titan_94: Autonomous Agent" → node agent.js

# Python bot:
pip install pyTelegramBotAPI google-generativeai requests
python bot/main.py
```

---

## 🔗 @BotFather CONFIG

```
/newbot → TITAN-94 Agent → @Titan_94_agent_bot
/setmenubutton → Web App
  URL: https://wilted-familiar-cable--titangenesis94.replit.app
  Text: ◈ TITAN Terminal

/setcommands
start - TITAN-94 активація
stats - Статистика
scan - Сканування TON
analyze - AI аналіз контракту
honeypot - HoneyPot детектор
threats - Активні загрози
market - Арбітраж
wallet - Reserve Fund
earn - Мої заробітки
heal - Healing цикл
```

---

## 💡 ТЕХНІЧНІ НОТАТКИ

1. `startHeartbeat()` в `index.ts` — запуск при старті API
2. `aiAccuracy` × 100 для відображення у %
3. Admin `7255058720` → автоматично ELITE
4. Webhook: 4.5–5.5 TON=PRO, 19–21 TON=ELITE
5. CPA 15%: при оплаті реферала → `billing[referrerId].balance += amount * 0.15`
6. Sniper Alert: нові контракти у SCAN циклі → `sniperAlerts[]`
7. Vite proxy: `/api/*` → `http://localhost:8080/api/*`
8. `uncaughtException` → self-heal вже у heartbeat.ts
9. Titan_94_agent — окремий npm, не в pnpm workspace
10. `/api/billing/withdraw` → потрібен `tonAddress` у профілі

---

*TITAN-94 «ОКО НЕБЕСНЕ» — DEI GRATIA*  
*Solo Deo Subjectus · © 2026 @Cryptoagentton*
