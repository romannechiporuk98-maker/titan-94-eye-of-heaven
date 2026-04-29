# TITAN-94 — Telegram Mini App Setup

Покрокова інструкція як підключити TITAN-94 як **Telegram Mini App (TMA)** через @BotFather.

---

## Крок 1 — Створи бот (якщо ще немає)

1. Відкрий [@BotFather](https://t.me/BotFather) в Telegram
2. Надішли `/newbot`
3. Введи ім'я: `TITAN-94 Око Небесне`
4. Введи username: `titan94_oko_bot` (або інший вільний)
5. **Скопіюй token** — виглядає як `7654321:AAH...xyz`

## Крок 2 — Додай токен у TITAN-94 Vault

1. Відкрий https://titan-94.replit.app/vault
2. Розблокуй паролем
3. У лівому списку обери **TG-BOT TOKEN** (група TELEGRAM)
4. Встав скопійований токен у поле, натисни **ЗБЕРЕГТИ**
5. Перезапусти API-сервер — бот автоматично активується

## Крок 3 — Підключи Mini App до бота

В @BotFather:

```
/newapp
```

→ Вибери свого бота

→ Введи дані:
- **Title**: `TITAN-94 ОКО НЕБЕСНЕ`
- **Description**: `Sovereign autonomous AI security agent for TON. AI Orchestra, Auto-Trade, Sniper, Arbitrage. Pay in TON or Stars.`
- **Photo**: завантаж 640×360 PNG/JPG (можна з `/opengraph.jpg`)
- **GIF demo**: пропусти (`/empty`)
- **Web App URL**: `https://titan-94.replit.app/`
- **Short name**: `titan94` (це буде в посиланні `t.me/titan94_oko_bot/titan94`)

## Крок 4 — Додай Menu Button (швидкий запуск)

```
/setmenubutton
```

→ Вибери бота → введи URL `https://titan-94.replit.app/` → введи текст кнопки `◈ ВІДКРИТИ TITAN-94`

## Крок 5 — Налаштуй основні команди (опційно)

```
/setcommands
```

→ Вибери бота → встав:

```
start - Запустити TITAN-94
vault - Відкрити Vault з API-ключами
access - Тарифи доступу (SCOUT/GUARDIAN/TITAN)
status - Статус організму
earn - Заробіток і реферальна програма
```

## Крок 6 — Включи Telegram Stars (опційно)

В @BotFather:
```
/mybots → [твій бот] → Payments → Connect Telegram Stars
```

Після цього у тарифах SCOUT/GUARDIAN/TITAN з'явиться оплата в Stars.

---

## Перевірка

1. Відкрий `t.me/<твій_бот>` — має бути кнопка меню `◈ ВІДКРИТИ TITAN-94`
2. Натисни її — TITAN-94 відкриється всередині Telegram як нативний застосунок
3. Перевір `/vault` — має одразу логінити твій TG ID (Roman = 7255058720) через initData HMAC
4. Якщо ти Creator (ID 7255058720) — має автоматично з'явитися прихований **DEVELOPER tier (1000 TON)** на сторінці `/access`

---

## Трабл-шутинг

| Симптом | Причина / рішення |
|---------|-------------------|
| Mini App не відкривається | Перевір що Web App URL = `https://titan-94.replit.app/` (з https і слешем) |
| Bot не реагує на `/start` | TG-BOT TOKEN не збережено у Vault — повтори Крок 2 і **перезапусти API-сервер** |
| Splash не зникає | Очисти кеш Telegram: Settings → Data and Storage → Clear Cache |
| Виглядає як міні-сайт без TMA фіч | Mini App SDK завантажується з `telegram.org/js/telegram-web-app.js` — переконайся що Telegram актуальної версії (7.0+) |
| `/access` не показує DEVELOPER | Ти не Roman (ID 7255058720) АБО initData не дійшла — відкрий через menu button бота, не через прямий URL |

---

## Що вже готово в коді

- `index.html` — Telegram Mini App SDK + viewport + theme color
- `public/tma-manifest.json` — Web App Manifest (PWA + TMA)
- `public/tonconnect-manifest.json` — TON Connect manifest
- `lib/telegram.ts` (frontend) — повна обгортка WebApp 7.0+ (BackButton, MainButton, CloudStorage, Haptic, Theme)
- `lib/telegram-auth.ts` (server) — HMAC валідація initData, прив'язка `req.tgUser`
- `attachTelegramUser` middleware — глобально на `/api`, автоматично прокидає Telegram user
- Creator auto-detect — TG ID 7255058720 → Roman → відкриває DEVELOPER tier (1000 TON)

---

**DEI GRATIA · Роман · v4.0**
