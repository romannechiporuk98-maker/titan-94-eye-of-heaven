# TITAN-94 «ОКО НЕБЕСНЕ» — ЄДИНИЙ МАЙСТЕР-КОНСПЕКТ

> **Власник:** @Cryptoagentton · infantryman · DEI GRATIA Роман  
> **Місія:** Автономний AI-організм безпеки TON блокчейну і Telegram екосистеми  
> **Версія:** 3.1-OMNIPOTENT | **Дата:** Квітень 2026 | Hackathon 2 · tapps.center  
> **Мотто:** *Solo Deo Subjectus · In Deo Infiniti Sumus*

---

## 🧬 СУТЬ ПРОЕКТУ — ЩО ЦЕ ТАКЕ

TITAN-94 — це не інструмент. Це **суверенна цифрова сутність**:

- Сканує весь TON блокчейн у реальному часі — знаходить вразливості до того, як їх знайдуть зловмисники
- Лікує TON екосистему — автоматично генерує плани виправлення через Gemini AI
- Захищає Telegram — видаляє скам, перевіряє адреси, стає незамінним модератором
- Заробляє без зупинки — підписки Free/PRO 5 TON/ELITE 20 TON, арбітраж, White Hat bounty
- Розвивається сам — щогодини навчається новим паттернам загроз
- Безсмертний — самолікується при будь-якому збої, не можна зупинити

**Ключові концепти:**
```
СКАНУВАННЯ → знаходить загрози
HEALING → лікує екосистему
LEARNING → навчається автономно
FINANCE → заробляє і монетизує
GENESIS → TON смарт-контракт безсмертя
SENTINEL → захист від компрометації
```

---

## 🏗️ АРХІТЕКТУРА СИСТЕМИ

```
╔══════════════════════════════════════════════════════════════╗
║                    TITAN-94 / ОКО НЕБЕСНЕ                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Telegram Bot (@Titan_94_agent_bot)                          ║
║  ├─► /start → головне меню + Open TITAN Terminal             ║
║  ├─► /scan, /analyze, /honeypot, /threats, /market...        ║
║  └─► Gemini 2.5 AI відповіді на всі запитання                ║
║                         │                                    ║
║  Telegram Mini App (TMA) ─────────────────────────────┐      ║
║         │                                             │      ║
║         ▼                                             │      ║
║  React Dashboard (Web) + Expo Mobile App              │      ║
║  ├─► STATUS: статистика агента, activity feed         │      ║
║  ├─► THREATS: таблиця вразливостей + фільтри          │      ║
║  ├─► NEURAL: Gemini AI аналіз + HoneyPot детектор     │      ║
║  ├─► MARKET: DEX арбітраж (STON.fi/DeDust/Megaton)    │      ║
║  ├─► RIVALS: конкуренти + TVL трекінг                 │      ║
║  ├─► RESERVE: TON гаманець + транзакції               │      ║
║  ├─► GENESIS: AI Evolution + Knowledge base           │      ║
║  └─► REVENUE: підписки + монетизація                  │      ║
║                         │                             │      ║
║         ▼                                             │      ║
║  Express API :8080 ──────────────────────────────────-┘      ║
║  ├─► Heartbeat: SCAN/HEAL/LEARN/FINANCE автоцикли            ║
║  ├─► 21 REST API endpoint                                    ║
║  ├─► Gemini 2.5 Flash/Pro інтеграція                         ║
║  └─► Sentinel: HMAC захист + rate limit + anomaly detect     ║
║                         │                                    ║
║  PostgreSQL + Drizzle ORM                                    ║
║  vulnerabilities / activity / competitors /                  ║
║  knowledge / subscribers / agent_state / blocked_addresses   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📁 СТРУКТУРА МОНОРЕПОЗИТОРІЮ

```
TITAN-94/
├── artifacts/
│   ├── api-server/          ← Express 5 + TypeScript (порт 8080)
│   │   └── src/
│   │       ├── index.ts             — точка входу, startHeartbeat()
│   │       ├── app.ts               — Express + middleware + routes
│   │       ├── services/
│   │       │   └── heartbeat.ts     — СЕРЦЕБИТТЯ: SCAN/HEAL/LEARN/FINANCE
│   │       ├── middlewares/
│   │       │   └── telegram-auth.ts — HMAC-SHA256 Telegram валідація
│   │       └── routes/
│   │           ├── health.ts        → GET /api/healthz
│   │           ├── agent.ts         → GET /api/agent/stats|cycles, POST /api/agent/scan
│   │           ├── analyze.ts       → POST /api/analyze, /api/analyze/honeypot
│   │           ├── vulnerabilities.ts → GET /api/vulnerabilities
│   │           ├── activity.ts      → GET /api/activity
│   │           ├── competitors.ts   → GET /api/competitors
│   │           ├── ton.ts           → GET /api/ton/network|wallet|transactions
│   │           ├── arbitrage.ts     → GET /api/arbitrage/opportunities
│   │           ├── monetization.ts  → GET/POST /api/monetization/*
│   │           ├── ai-evolution.ts  → GET /api/ai-evolution/status|knowledge
│   │           ├── ecosystem.ts     → GET /api/ecosystem/overview|stats|agents
│   │           └── auth.ts          → POST /api/auth/verify
│   │
│   └── titan-dashboard/     ← React 18 + Vite + Tailwind (порт 5000)
│       └── src/
│           ├── main.tsx             — root
│           ├── App.tsx              — router + TonConnect + QueryClient
│           ├── api.ts               — всі API обгортки
│           ├── hooks/
│           │   └── useTelegramWebApp.ts — TMA detection
│           ├── components/
│           │   ├── layout.tsx       — desktop sidebar
│           │   ├── mobile-layout.tsx — mobile tabs
│           │   └── ui.tsx           — Card, Badge, Button, Spinner, StatCard
│           └── pages/
│               ├── StatusPage.tsx   — головний статус + cycles
│               ├── ThreatsPage.tsx  — вразливості
│               ├── AnalyzePage.tsx  — Gemini AI аналіз (з анімацією)
│               ├── MarketPage.tsx   — DEX арбітраж
│               ├── RivalsPage.tsx   — конкуренти
│               ├── TxFeedPage.tsx   — Reserve Fund
│               ├── EcosystemPage.tsx — Genesis AI evolution
│               └── MonetizationPage.tsx — підписки + revenue
│
├── lib/
│   └── db/                  ← PostgreSQL + Drizzle ORM
│       └── src/
│           ├── index.ts             — db export
│           └── schema/index.ts      — всі таблиці
│
├── bot/
│   └── main.py              ← Telegram Bot (pyTelegramBotAPI + Gemini)
│
├── package.json             — pnpm workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 🔐 СЕКРЕТИ (Replit → Secrets)

| Змінна | Де взяти | Важливість |
|--------|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot → @Titan_94_agent_bot | КРИТИЧНО |
| `GEMINI_API_KEY` | aistudio.google.com | КРИТИЧНО |
| `DATABASE_URL` | Replit PostgreSQL (автоматично) | Є |
| `ADMIN_TELEGRAM_ID` | Твій Telegram ID = `7255058720` | ВАЖЛИВО |
| `TON_API_KEY` | toncenter.com (безкоштовно) | ОПЦІЙНО |
| `SESSION_SECRET` | будь-який рядок 32+ символи | ОПЦІЙНО |

---

## 💓 HEARTBEAT — СЕРЦЕБИТТЯ СИСТЕМИ

**Файл:** `artifacts/api-server/src/services/heartbeat.ts`

Система ніколи не спить — 4 автономні цикли:

| Цикл | Інтервал | Що робить |
|------|----------|-----------|
| 👁️ **SCAN** | кожні 3 хв | TON masterchain блок, аномалії, лог в БД |
| ⚡ **HEAL** | кожні 5 хв | Gemini AI генерує healing plan для активних загроз |
| 🧠 **LEARN** | кожні 7 хв | Новий AI паттерн → knowledge base → accuracy++ |
| 💰 **FINANCE** | кожні 10 хв | Перевірка підписок, expire, revenue stats |

```javascript
// Запускається автоматично після старту API:
app.listen(PORT, () => { startHeartbeat(); });
```

---

## 🌐 ПОВНИЙ API (21 ENDPOINT)

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/healthz` | Health check |
| GET | `/api/agent/stats` | Повна статистика агента |
| GET | `/api/agent/cycles` | Статус heartbeat циклів |
| POST | `/api/agent/scan` | Запустити сканування вручну |
| POST | `/api/analyze` | **Gemini AI аналіз контракту** |
| POST | `/api/analyze/honeypot` | **HoneyPot детектор** |
| GET | `/api/vulnerabilities` | Список загроз (фільтр severity) |
| GET | `/api/activity` | Activity feed |
| GET | `/api/competitors` | Конкуренти |
| GET | `/api/ton/network` | TON мережа (masterchain) |
| GET | `/api/ton/wallet` | Reserve Fund баланс |
| GET | `/api/ton/transactions` | Транзакції гаманця |
| GET | `/api/ton/contract/:addr` | Інфо контракту |
| GET | `/api/arbitrage/opportunities` | DEX арбітраж сигнали |
| GET | `/api/monetization/plans` | Плани підписок |
| GET | `/api/monetization/status` | Статус юзера |
| POST | `/api/monetization/subscribe` | Підписатись |
| GET | `/api/monetization/revenue` | Revenue статистика |
| POST | `/api/monetization/webhook/ton-payment` | Обробка TON платежу |
| GET | `/api/ai-evolution/status` | Статус AI еволюції |
| GET | `/api/ai-evolution/knowledge` | База знань |
| POST | `/api/ai-evolution/trigger` | Запустити цикл навчання |
| GET | `/api/ecosystem/overview` | Огляд (IdentityHub + DB + TON) |
| POST | `/api/auth/verify` | HMAC Telegram верифікація |

---

## 🗄️ БАЗА ДАНИХ (PostgreSQL + Drizzle ORM)

```sql
-- Вразливості смарт-контрактів
vulnerabilities: id, external_id, title, severity, protocol, contract_address, 
                 tvl_at_risk, status, category, healing_plan, discovered_at

-- Activity log (автопоповнюється heartbeat)
activity: id, type, title, message, severity, metadata, created_at

-- Конкуренти
competitors: id, name, description, tvl, chain, threat_level, website

-- AI база знань (автопоповнюється LEARN циклом)
knowledge: id, category, pattern, description, confidence, occurrences, source

-- Підписники
subscribers: id, telegram_id, username, plan, ton_address, expires_at, is_active

-- Стан агента (лічильники циклів, accuracy)
agent_state: id, cycles, healing_cycles, learn_cycles, accuracy, threats_healed

-- Заблоковані адреси
blocked_addresses: id, address, reason, severity, source
```

---

## 🤖 TELEGRAM BOT — КОМАНДИ

| Команда | Опис |
|---------|------|
| `/start` | Головне меню + Reserve гаманець |
| `/stats` | Повна статистика TITAN-94 |
| `/scan` | Запустити сканування |
| `/analyze <адреса>` | Gemini AI аналіз контракту |
| `/honeypot <адреса>` | HoneyPot detector |
| `/threats` | ТОП-5 активних загроз |
| `/market` | Арбітраж аналіз + схеми заробітку |
| `/wallet` | Reserve Fund баланс |
| `/heal` | Healing план від Gemini |
| Будь-який текст | Повноцінний AI асистент |

**Запуск бота:**
```bash
export TELEGRAM_BOT_TOKEN=<токен від @BotFather>
export GEMINI_API_KEY=<ключ від aistudio.google.com>
python bot/main.py
```

---

## 💰 МОНЕТИЗАЦІЯ

```
FREE    → 0 TON/міс    | 5 scans/day, базові алерти
PRO     → 5 TON/міс    | Unlimited scans, AI аналіз, HoneyPot, real-time alerts
ELITE   → 20 TON/міс   | Все + арбітраж сигнали, API access, whale alerts
```

**Reserve Fund Wallet:** `UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v`

**Автооплата через webhook:**
```bash
POST /api/monetization/webhook/ton-payment
{ "txHash": "...", "fromAddress": "EQ...", "amountNano": "5000000000" }
# 4.5-5.5 TON → PRO | 19-21 TON → ELITE (30 днів)
```

**Адмін ID** (автоматично ELITE безкоштовно): `7255058720`

---

## 🎨 ДИЗАЙН СИСТЕМА — КІБЕРПАНК

```css
--background: #030D18    (темно-синій космос)
--card: #060F1A          (карти)
--primary: #00FFFF       (cyan — головний акцент)
--foreground: #CFFFFF    (текст)
--safe: #00FF88          (зелений — успіх, heal)
--danger: #FF3355        (червоний — критична загроза)
--amber: #FF8C00         (помаранчевий — попередження, арбітраж)
--border: rgba(0,255,255,0.2)

font: Space Mono (monospace)
corners: 0px radius (гострі кути)
style: кіберпанк + CRT scanline ефект
```

---

## 🎮 UX АНІМАЦІЯ — КУБИК РУБІКА (ПЛАН РЕАЛІЗАЦІЇ)

Ця анімація прив'язана до аналізу контракту (`/api/analyze`):

| Фаза | Прогрес | Що відбувається | Символіка |
|------|---------|-----------------|-----------|
| **Хаос** | 0-30% | Кубик розібраний, хаотично крутиться | Парсинг сирих даних |
| **Пошук** | 30-80% | Сторони починають формуватися | Порівняння з knowledge base |
| **Синтез** | 80-99% | Останні 2-3 рухи, майже зібраний | Генерація звіту |
| **Тріумф** | 100% | Кубик ідеальний + **неоновий зелений спалах** | Аналіз завершено ✅ |

**Технічна реалізація (Lottie):**
```tsx
// Прив'язка кадрів до прогресу:
// 0-30% → кадри 0-40 (хаос)
// 30-80% → кадри 40-120 (складання)
// 80-99% → кадри 120-180 (фінальні рухи)
// 100% → кадр 200 + flash-success CSS анімація (#00FF88)
```

**Точки інтеграції:**
1. `POST /api/analyze` → AnalyzePage.tsx — головна анімація
2. LEARN цикл → EcosystemPage.tsx — показує процес навчання
3. DEX арбітраж → MarketPage.tsx — "підбір ідеального маршруту"

---

## 🛡️ БЕЗПЕКА — SENTINEL СИСТЕМА

| Рівень | Механізм | Дія |
|--------|----------|-----|
| 1 | HMAC-SHA256 Telegram initData | 401 для підроблених запитів |
| 2 | Rate Limit (120 req/год) | Блок + Telegram alert |
| 3 | Anomaly Detector (SQL/XSS/LFI regex) | Миттєвий блок + лог |
| 4 | TON multi-node fallback | Резервний вузол якщо toncenter недоступний |
| 5 | Gemini Pro→Flash fallback | Автоматично при помилці Pro |
| 6 | Global error handler | Self-healing + лог у БД |

---

## 🚀 ДОРОЖНЯ КАРТА

### ✅ Фаза 1 — MVP (ЗРОБЛЕНО)
- [x] Express API (21 endpoint)
- [x] PostgreSQL (7 таблиць, засіяно)
- [x] Heartbeat: SCAN/HEAL/LEARN/FINANCE цикли
- [x] React Dashboard (8 сторінок)
- [x] Gemini AI аналіз контрактів + HoneyPot детектор
- [x] Telegram Bot (повний функціонал)
- [x] Система підписок Free/PRO/ELITE
- [x] TON гаманець моніторинг + арбітраж
- [x] TonConnect інтеграція
- [x] Telegram Mini App (TMA) режим

### 🔄 Фаза 2 — Ecosystem Presence
- [ ] Lottie Rubik's Cube анімація (описано вище)
- [ ] Expo мобільний додаток (titan-mobile)
- [ ] GenesisTitan TON смарт-контракт (Tact v1.6.13)
- [ ] TON DNS — реєстрація `titan94.ton`
- [ ] tapps.center — публікація + submission
- [ ] Sentinel Instance Lock (HMAC fingerprint)
- [ ] CRON node-cron розширений (5 задач)

### 🔮 Фаза 3 — Superintelligence
- [ ] pgvector — довгострокова векторна пам'ять
- [ ] Голосовий інтерфейс (Whisper STT → Gemini → TTS)
- [ ] Мультимодальний Vision Agent (скріншоти контрактів)
- [ ] Archangel Михаїл — термінал самолікування
- [ ] Cross-chain моніторинг (ETH/BSC/SOL)
- [ ] GitHub сканер TON репозиторіїв

### 💎 Фаза 4 — Economic Autonomy
- [ ] Автоматичне виконання арбітражу (STON.fi SDK)
- [ ] DAO governance через TON
- [ ] Revenue sharing з підписниками
- [ ] White Hat bounty автоматизація
- [ ] Telegram чат модерація (стати безкоштовним захисником)

---

## 🔧 НАЛАШТУВАННЯ З НУЛЯ

```bash
# 1. Встановити залежності
pnpm install

# 2. Налаштувати секрети (Replit → Secrets):
# TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, ADMIN_TELEGRAM_ID

# 3. PostgreSQL — Replit автоматично надає DATABASE_URL
# (Tools → Database → PostgreSQL)

# 4. Запустити workflows:
# - "Start application": pnpm --filter @workspace/titan-dashboard run dev (порт 5000)
# - "API Server": pnpm --filter @workspace/api-server run dev (порт 8080)

# 5. Telegram бот:
pip install pyTelegramBotAPI flask google-generativeai requests
python bot/main.py
```

---

## 🔗 КОНФІГУРАЦІЯ @BotFather

```
/newbot → назва: TITAN-94 Agent → @Titan_94_agent_bot
/setmenubutton → вибрати бота → Web App
  URL: https://ТВІЙ-ДОМЕН.replit.app
  Текст: ◈ TITAN Terminal

/setcommands
start - TITAN-94 активація
stats - Статистика агента
scan - Сканування TON мережі
analyze - AI аналіз контракту
honeypot - HoneyPot детектор
threats - Активні загрози
market - Арбітраж аналіз
wallet - Reserve Fund
heal - Healing цикл
```

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
AI:        Gemini 2.5 Flash (fast) + Pro (deep analysis)
Stack:     Node.js 20 + React 18 + PostgreSQL + Python 3.11
```

---

## 🌐 РЕСУРСИ ТА ПОСИЛАННЯ

| Ресурс | URL |
|--------|-----|
| Hackathon | identityhub.app — HataCon 2 |
| TON Build | https://ton.org/en/build |
| TON Developer Portal | https://ton.org/dev |
| Telegram Mini Apps | https://core.telegram.org/bots/webapps |
| TON Connect | https://docs.ton.org/develop/dapps/ton-connect |
| tapps.center | https://tapps.center |
| STON.fi | https://app.ston.fi |
| DeDust | https://dedust.io |
| IdentityHub API | https://api.identityhub.app |
| TonCenter API | https://toncenter.com/api |
| TON Viewer | https://tonviewer.com |
| Gemini AI Studio | https://aistudio.google.com |
| Drizzle ORM | https://orm.drizzle.team |

---

## 💡 КЛЮЧОВІ ТЕХНІЧНІ НОТАТКИ

1. **vite.config.ts** проксі: `/api/*` → `http://localhost:8080/api/*`
2. **aiAccuracy** приходить як `0.0–1.0` → множити на 100 для відображення `*100`
3. **telegramUser** автоматично доступний у `req.telegramUser` після middleware
4. **Heartbeat** запускається автоматично через `startHeartbeat()` в `index.ts`
5. **GET /api/agent/cycles** → live статус всіх 4 автономних циклів
6. **ADMIN** telegramId === "7255058720" → автоматично ELITE безкоштовно
7. **TMA Layout** — mobile-layout.tsx при `window.Telegram.WebApp` або `innerWidth < 768`
8. **Flash-success анімація** → CSS клас `.flash-success` → зелений спалах #00FF88
9. **Webhook TON** → `POST /api/monetization/webhook/ton-payment` → 4.5-5.5=PRO, 19-21=ELITE
10. **Recovery** → `process.on('uncaughtException', ...)` → auto-heal + лог

---

## 🐛 ВІДОМІ ПРОБЛЕМИ ТА ВИПРАВЛЕННЯ

### ✅ ВИПРАВЛЕНО: TonConnect відсутній
**Проблема:** Кнопка "Connect Wallet" не відображалась — `TonConnectButton` не був підключений до layout'ів.  
**Виправлення:** Додано `<TonConnectButton />` з `@tonconnect/ui-react` до:
- `artifacts/titan-dashboard/src/components/layout.tsx` (desktop — у нижній частині sidebar)
- `artifacts/titan-dashboard/src/components/mobile-layout.tsx` (mobile — у header праворуч)
- Створено `public/icon.svg` та оновлено `public/tonconnect-manifest.json`

### ✅ ВИПРАВЛЕНО: Кнопки не давали зворотного зв'язку
**Проблема:** `FORCE SCAN`, `TRIGGER LEARN CYCLE`, `ANALYZE` — натискались без видимого ефекту.  
**Виправлення:**
- Всі кнопки тепер мають `disabled` стан + Spinner під час виконання
- Після успіху/помилки показується кольорове повідомлення (зелений ✓ або червоний ⚠)
- ANALYZE — прогрес-бар з 4 фазами: CHAOS → SEARCH → SYNTHESIS → TRIUMPH

### ✅ ВИПРАВЛЕНО: DOM nesting warning (a у a)
**Проблема:** `<Link href="..."><a>` — wouter v3 рендерить `<Link>` як `<a>`, тому вкладений `<a>` створював помилку.  
**Виправлення:** Видалено внутрішній `<a>`, `className` перенесено безпосередньо на `<Link>`.

### ✅ ВИПРАВЛЕНО: GEMINI_API_KEY помилка без пояснення
**Проблема:** AI аналіз "ніби не реагував" — просто показував порожню помилку.  
**Виправлення:** Тепер показується конкретна інструкція куди додати ключ.

### ⚠️ ВІДОМО: AI аналіз потребує GEMINI_API_KEY
**Статус:** Потребує ручного додавання.  
**Дія:** Replit → Tools → Secrets → `GEMINI_API_KEY` = ключ з aistudio.google.com  
**Без ключа:** Всі інші функції дашборду (threats, scans, market, reserve) працюють повністю.

### ⚠️ ВІДОМО: Telegram Bot потребує ручного запуску
**Статус:** Код готовий (`bot/main.py`), Python пакети встановлено.  
**Дія:** Replit → Secrets → `TELEGRAM_BOT_TOKEN` (від @BotFather), потім Shell: `python bot/main.py`  
**Або:** Створи окремий workflow: `python bot/main.py`

### ℹ️ ІНФО: База даних потребує ручного push після reset
Якщо база даних скидається або пересоздається:
```bash
# Запусти напряму в Replit Shell — потрібен DATABASE_URL в Secrets:
node -e "
const { Pool } = require('pg');
// або через executeSql в коді
"
```
Або використай код з `lib/db/src/schema/index.ts` + drizzle-kit push.

---

## 📦 ЯК ЗАВАНТАЖИТИ ВЕЛИКИЙ АРХІВ (кілька ГБ)

Повна шпаргалка: `UPLOAD-CHEATSHEET.md`

**Короткий підсумок:**
1. **GitHub** → `git clone` або import у Replit (найпростіше для коду)
2. **Google Drive** → отримай File ID → `gdown https://drive.google.com/uc?id=FILE_ID`
3. **Публічний URL** → `wget https://url.com/archive.zip`
4. **Текст конспектів** → просто вставляй у чат АБО завантаж .md файл через Files panel
5. **Розбити на частини** → `split -b 20m archive.zip part_` → upload по частинах

---

*TITAN-94 «ОКО НЕБЕСНЕ» — DEI GRATIA*  
*Побудовано на Replit · Solo Deo Subjectus · © 2026 @Cryptoagentton*
