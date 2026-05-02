/**
 * UI Preferences — theme (dark/light) and language (uk/en/ru).
 *
 * Persisted in localStorage. Theme is also pushed to <html data-theme>
 * so CSS can override variables. Language is exposed via the `t()`
 * helper for translatable UI strings.
 */
import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";
export type Lang  = "uk" | "en" | "ru" | "de" | "tr" | "zh";
export type Tz    = "auto" | "Europe/Kyiv" | "UTC" | "Europe/London" | "America/New_York" | "Asia/Singapore";

const THEME_KEY = "titan94.theme";
const LANG_KEY  = "titan94.lang";
const TZ_KEY    = "titan94.tz";

export const TZ_OPTIONS: { value: Tz; label: string }[] = [
  { value: "auto",            label: "Auto" },
  { value: "Europe/Kyiv",     label: "Київ" },
  { value: "UTC",             label: "UTC" },
  { value: "Europe/London",   label: "London" },
  { value: "America/New_York",label: "New York" },
  { value: "Asia/Singapore",  label: "Singapore" },
];

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" ? "light" : "dark";
}

function readLang(): Lang {
  if (typeof window === "undefined") return "uk";
  const v = localStorage.getItem(LANG_KEY);
  const LANGS: Lang[] = ["uk", "en", "ru", "de", "tr", "zh"];
  if (v && LANGS.includes(v as Lang)) return v as Lang;
  const nav = navigator.language?.toLowerCase() || "";
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("tr")) return "tr";
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("en")) return "en";
  return "uk";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
  }, []);
  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);
  return { theme, setTheme, toggle };
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);
  return { lang, setLang };
}

function readTz(): Tz {
  if (typeof window === "undefined") return "auto";
  const v = localStorage.getItem(TZ_KEY) as Tz | null;
  if (!v) return "auto";
  if (TZ_OPTIONS.some(o => o.value === v)) return v;
  return "auto";
}

export function useTimezone() {
  const [tz, setTzState] = useState<Tz>(readTz);
  const setTz = useCallback((z: Tz) => {
    localStorage.setItem(TZ_KEY, z);
    setTzState(z);
  }, []);
  return { tz, setTz };
}

export function resolveTz(tz: Tz): string {
  if (tz !== "auto") return tz;
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
  catch { return "UTC"; }
}

export function fmtTime(input: Date | string | number, tz: Tz, opts?: Intl.DateTimeFormatOptions): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const timeZone = resolveTz(tz);
  return new Intl.DateTimeFormat("uk-UA", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone,
    ...opts,
  }).format(d);
}

export function fmtClock(input: Date | string | number, tz: Tz): string {
  return fmtTime(input, tz, { year: undefined, month: undefined, day: undefined, second: undefined });
}

// ── Translation dictionary ─────────────────────────────────────────────
// Each entry may omit new language codes — t() falls back to "en" then "uk".
type Dict = Record<string, Partial<Record<Lang, string>>>;

const DICT: Dict = {
  // ── Navigation labels ──────────────────────────────────────────────
  "nav.command":   { uk: "Командний центр",  en: "Command Center",  ru: "Командный центр",  de: "Kontrollzentrum",   tr: "Komuta Merkezi",   zh: "指挥中心" },
  "nav.threats":   { uk: "Загрози",          en: "Threats",         ru: "Угрозы",           de: "Bedrohungen",       tr: "Tehditler",        zh: "威胁" },
  "nav.contracts": { uk: "Смартконтракти",   en: "Smart Contracts", ru: "Смартконтракты",   de: "Smart Contracts",   tr: "Akıllı Sözleşme", zh: "智能合约" },
  "nav.analyze":   { uk: "Нейрохаб",         en: "Neural Hub",      ru: "Нейрохаб",         de: "Neuraler Hub",      tr: "Sinir Merkezi",    zh: "神经中枢" },
  "nav.evolution": { uk: "Еволюція",         en: "Evolution",       ru: "Эволюция",         de: "Evolution",         tr: "Evrim",            zh: "进化" },
  "nav.immune":    { uk: "Імунна система",   en: "Immune System",   ru: "Иммунная система", de: "Immunsystem",       tr: "Bağışıklık",       zh: "免疫系统" },
  "nav.analytics": { uk: "Аналітика",        en: "Analytics",       ru: "Аналитика",        de: "Analytik",          tr: "Analitik",         zh: "数据分析" },
  "nav.status":    { uk: "Статус агента",    en: "Agent Status",    ru: "Статус агента",    de: "Agentenstatus",     tr: "Ajan Durumu",      zh: "代理状态" },
  "nav.earn":      { uk: "Заробіток",        en: "Earnings",        ru: "Заработок",        de: "Einnahmen",         tr: "Kazançlar",        zh: "收益" },
  "nav.autotrade": { uk: "Авто-трейд",       en: "Auto-Trade",      ru: "Авто-трейд",       de: "Auto-Trading",      tr: "Otomatik Ticaret", zh: "自动交易" },
  "nav.builder":   { uk: "Кузня агентів",    en: "Agent Forge",     ru: "Кузня агентов",    de: "Agenten-Forge",     tr: "Ajan Atölyesi",    zh: "代理锻造" },
  "nav.developer": { uk: "Режим розробника", en: "Developer Mode",  ru: "Режим разработчика",de: "Entwicklermodus",  tr: "Geliştirici Modu", zh: "开发者模式" },
  "nav.nexus":     { uk: "NEXUS AI",         en: "NEXUS AI",        ru: "NEXUS AI",         de: "NEXUS AI",          tr: "NEXUS AI",         zh: "NEXUS AI" },
  "nav.settings":  { uk: "API Сейф",         en: "API Vault",       ru: "API Сейф",         de: "API-Tresor",        tr: "API Kasası",       zh: "API 密钥库" },
  "nav.vault":     { uk: "Мобільний сейф",   en: "Mobile Vault",    ru: "Мобильный сейф",   de: "Mobile Tresor",     tr: "Mobil Kasa",       zh: "移动金库" },
  "nav.access":    { uk: "Тарифи доступу",   en: "Access Tiers",    ru: "Тарифы доступа",   de: "Zugangsstufen",     tr: "Erişim Planları",  zh: "访问套餐" },
  "nav.enact":     { uk: "ENACT огляд",      en: "ENACT Overview",  ru: "ENACT обзор",      de: "ENACT Übersicht",   tr: "ENACT Genel",      zh: "ENACT 概览" },
  "nav.jobs":      { uk: "Робочі завдання",  en: "Job Explorer",    ru: "Задания",          de: "Aufgaben",          tr: "Görevler",         zh: "任务列表" },
  "nav.create":    { uk: "Створити завдання",en: "Create Job",      ru: "Создать задание",  de: "Aufgabe erstellen", tr: "Görev Oluştur",    zh: "创建任务" },
  "nav.creator":   { uk: "Творець",          en: "Creator",         ru: "Создатель",        de: "Ersteller",         tr: "Yaratıcı",         zh: "创建者" },
  "nav.about":     { uk: "Про систему",      en: "About",           ru: "О системе",        de: "Über uns",          tr: "Hakkında",         zh: "关于" },
  "nav.privacy":   { uk: "Конфіденційність", en: "Privacy Policy",  ru: "Конфиденциальность", de: "Datenschutz",    tr: "Gizlilik",         zh: "隐私政策" },

  // ── Nav descriptions (shown in info modal) ─────────────────────────
  "nav.command.desc": {
    uk: "Головна панель TITAN-94. Реальний час: стан 4 циклів агента (SCAN/HEAL/LEARN/FINANCE), останні загрози, баланс Reserve Wallet та ключові метрики.",
    en: "TITAN-94 main dashboard. Real-time: state of 4 agent cycles (SCAN/HEAL/LEARN/FINANCE), latest threats, Reserve Wallet balance and key metrics.",
    ru: "Главная панель TITAN-94. Реальное время: состояние 4 циклов агента, последние угрозы, баланс Reserve Wallet и ключевые метрики.",
  },
  "nav.command.instr": {
    uk: "Відкривається автоматично при вході. Зелений індикатор = OK, жовтий = увага, червоний = критично. Натисни на картку циклу щоб побачити деталі останнього запуску.",
    en: "Opens automatically on entry. Green indicator = OK, yellow = warning, red = critical. Click on a cycle card to see details of the last run.",
    ru: "Открывается автоматически при входе. Зелёный = OK, жёлтый = внимание, красный = критично. Нажми на карточку цикла для деталей последнего запуска.",
  },

  "nav.threats.desc": {
    uk: "Реєстр вразливостей TON-контрактів, виявлених агентом. SCAN-цикл (кожні 3 хв) знаходить нові загрози і класифікує за рівнем: critical / high / medium / low.",
    en: "Registry of TON contract vulnerabilities detected by the agent. SCAN cycle (every 3 min) finds new threats and classifies them: critical / high / medium / low.",
    ru: "Реестр уязвимостей TON-контрактов, обнаруженных агентом. SCAN-цикл (каждые 3 мин) находит новые угрозы и классифицирует их по уровню.",
  },
  "nav.threats.instr": {
    uk: "Фільтруй за рівнем небезпеки або статусом. Натисни «Вилікувати» — агент запустить HEAL-цикл для цієї вразливості. Критичні загрози надсилаються в Telegram автоматично.",
    en: "Filter by severity or status. Click 'Heal' — the agent will run a HEAL cycle for this vulnerability. Critical threats are sent to Telegram automatically.",
    ru: "Фильтруй по уровню опасности или статусу. Нажми «Вылечить» — агент запустит HEAL-цикл. Критические угрозы отправляются в Telegram автоматически.",
  },

  "nav.contracts.desc": {
    uk: "Прямий зв'язок з ENACT Factory та Reserve Fund на блокчейні TON. Перегляд балансів та взаємодія через TON Connect гаманець.",
    en: "Direct access to ENACT Factory and Reserve Fund on TON blockchain. View balances and interact via TON Connect wallet.",
    ru: "Прямой доступ к ENACT Factory и Reserve Fund на блокчейне TON. Просмотр балансов и взаимодействие через TON Connect кошелёк.",
  },
  "nav.contracts.instr": {
    uk: "Підключи TON-гаманець кнопкою «Connect» у верхньому куті. Після підключення можна підписувати транзакції напряму — без copy-paste адрес.",
    en: "Connect your TON wallet with the 'Connect' button in the top corner. After connecting, you can sign transactions directly — no copy-paste needed.",
    ru: "Подключи TON-кошелёк кнопкой «Connect» в верхнем углу. После подключения можно подписывать транзакции напрямую — без copy-paste адресов.",
  },

  "nav.analyze.desc": {
    uk: "AI-аналізатор смартконтрактів на базі Gemini. Введи адресу або код контракту — отримай детальний аудит на reentrancy, overflow, backdoor та інші вразливості.",
    en: "AI smart contract analyzer based on Gemini. Enter an address or contract code — get a detailed audit for reentrancy, overflow, backdoor and other vulnerabilities.",
    ru: "AI-анализатор смартконтрактов на базе Gemini. Введи адрес или код контракта — получи детальный аудит на reentrancy, overflow, backdoor и другие уязвимости.",
  },
  "nav.analyze.instr": {
    uk: "Введи адресу TON-контракту або вставь bytecode. Для глибокого аналізу встанови Gemini API Key у розділі «API Сейф». Результат зберігається в базі знань агента.",
    en: "Enter a TON contract address or paste bytecode. For deep analysis, set your Gemini API Key in 'API Vault'. Results are saved to the agent's knowledge base.",
    ru: "Введи адрес TON-контракта или вставь bytecode. Для глубокого анализа установи Gemini API Key в разделе «API Сейф». Результат сохраняется в базе знаний агента.",
  },

  "nav.evolution.desc": {
    uk: "Трекер самонавчання TITAN-94. Кожен LEARN-цикл (кожні 7 хв) додає новий патерн атаки. Показує зростання бази знань та точності виявлення загроз.",
    en: "TITAN-94 self-learning tracker. Every LEARN cycle (every 7 min) adds a new attack pattern. Shows growth of knowledge base and threat detection accuracy.",
    ru: "Трекер самообучения TITAN-94. Каждый LEARN-цикл (каждые 7 мин) добавляет новый паттерн атаки. Показывает рост базы знаний и точности обнаружения угроз.",
  },
  "nav.evolution.instr": {
    uk: "Спостерігай за кривою точності — вона має постійно зростати. Якщо зростання зупинилось — перевір статус LEARN-циклу в «Імунній системі». Встанови Gemini API Key для кращих патернів.",
    en: "Watch the accuracy curve — it should continuously grow. If growth stops, check the LEARN cycle status in 'Immune System'. Install Gemini API Key for better patterns.",
    ru: "Следи за кривой точности — она должна постоянно расти. Если рост остановился — проверь статус LEARN-цикла в «Иммунной системе». Установи Gemini API Key для лучших паттернов.",
  },

  "nav.immune.desc": {
    uk: "Моніторинг захисних механізмів: стан циклів SCAN/HEAL/LEARN/FINANCE, blacklist адрес, активні щити системи та статус всіх підсистем.",
    en: "Monitoring of protection mechanisms: state of SCAN/HEAL/LEARN/FINANCE cycles, address blacklist, active system shields and status of all subsystems.",
    ru: "Мониторинг защитных механизмов: состояние циклов SCAN/HEAL/LEARN/FINANCE, blacklist адресов, активные щиты системы и статус всех подсистем.",
  },
  "nav.immune.instr": {
    uk: "Якщо цикл показує червоний — він призупинений або має помилки. Зверніться до Творця для перезапуску. Зелений по всіх циклах = система повністю активна.",
    en: "If a cycle shows red — it's paused or has errors. Contact the Creator for restart. Green on all cycles = system is fully active.",
    ru: "Если цикл показывает красный — он приостановлен или имеет ошибки. Обратитесь к Создателю для перезапуска. Зелёный по всем циклам = система полностью активна.",
  },

  "nav.analytics.desc": {
    uk: "Інтерактивні графіки активності системи: загрози за тиждень, розподіл планів підписки, доходи та виконані цикли агента.",
    en: "Interactive system activity charts: threats per week, subscription plan distribution, revenue and completed agent cycles.",
    ru: "Интерактивные графики активности системы: угрозы за неделю, распределение планов подписки, доходы и выполненные циклы агента.",
  },
  "nav.analytics.instr": {
    uk: "Наводь на точки графіків для деталей. Дані оновлюються в реальному часі. Графік загроз відображає роботу SCAN-циклу за останні 7 днів.",
    en: "Hover over chart points for details. Data updates in real time. The threat chart shows SCAN cycle activity over the last 7 days.",
    ru: "Наводи на точки графиков для деталей. Данные обновляются в реальном времени. График угроз отображает работу SCAN-цикла за последние 7 дней.",
  },

  "nav.status.desc": {
    uk: "Live-моніторинг всіх процесів TITAN-94: останній блок TON, uptime, точність виявлення загроз, кількість виконаних циклів.",
    en: "Live monitoring of all TITAN-94 processes: last TON block, uptime, threat detection accuracy, number of completed cycles.",
    ru: "Live-мониторинг всех процессов TITAN-94: последний блок TON, uptime, точность обнаружения угроз, количество выполненных циклов.",
  },
  "nav.status.instr": {
    uk: "Оновлюється кожні 15 секунд. Якщо lastBlockSeqno не змінюється кілька хвилин — можливі проблеми з TonCenter API. Accuracy має бути вище 90% при здоровій системі.",
    en: "Updates every 15 seconds. If lastBlockSeqno doesn't change for a few minutes — possible issues with TonCenter API. Accuracy should be above 90% in a healthy system.",
    ru: "Обновляется каждые 15 секунд. Если lastBlockSeqno не меняется несколько минут — возможны проблемы с TonCenter API. Accuracy должна быть выше 90% при здоровой системе.",
  },

  "nav.earn.desc": {
    uk: "Особистий баланс TON, авто-нарахування (кожні 6 хв для PRO/ELITE), реферальна програма (15% CPA) та виведення коштів.",
    en: "Personal TON balance, auto-earning (every 6 min for PRO/ELITE), referral program (15% CPA) and fund withdrawal.",
    ru: "Личный баланс TON, авто-начисление (каждые 6 мин для PRO/ELITE), реферальная программа (15% CPA) и вывод средств.",
  },
  "nav.earn.instr": {
    uk: "PRO/ELITE підписники отримують автоматичні нарахування кожні 6 хвилин. Мінімум виводу: 0.5 TON. Реферальне посилання — поділись ним щоб отримати 15% від підписок запрошених.",
    en: "PRO/ELITE subscribers receive automatic accruals every 6 minutes. Minimum withdrawal: 0.5 TON. Share your referral link to get 15% from invited users' subscriptions.",
    ru: "PRO/ELITE подписчики получают автоматические начисления каждые 6 минут. Минимум вывода: 0.5 TON. Поделись реферальной ссылкой — получи 15% от подписок приглашённых.",
  },

  "nav.autotrade.desc": {
    uk: "Автоматичні торгові стратегії на основі сигналів TITAN-94. Налаштовуй параметри ризику, вибирай пари та стратегії.",
    en: "Automated trading strategies based on TITAN-94 signals. Configure risk parameters, choose pairs and strategies.",
    ru: "Автоматические торговые стратегии на основе сигналов TITAN-94. Настраивай параметры риска, выбирай пары и стратегии.",
  },
  "nav.autotrade.instr": {
    uk: "Спочатку налаштуй Binance API ключі в «API Сейфі». Потім вибери стратегію (консервативна/агресивна) та встанови максимальний ризик на угоду. Стартуй торгівлю кнопкою «Активувати».",
    en: "First set up Binance API keys in 'API Vault'. Then choose a strategy (conservative/aggressive) and set the maximum risk per trade. Start trading with the 'Activate' button.",
    ru: "Сначала настрой Binance API ключи в «API Сейфе». Затем выбери стратегию (консервативная/агрессивная) и установи максимальный риск на сделку. Запусти торговлю кнопкой «Активировать».",
  },

  "nav.builder.desc": {
    uk: "Конструктор нових AI-агентів для TON блокчейну. Вибір типу агента (Security/Trading/Oracle), параметрів, автоматичний деплой смартконтракту.",
    en: "Constructor for new AI agents for TON blockchain. Choose agent type (Security/Trading/Oracle), configure parameters, automatic smart contract deployment.",
    ru: "Конструктор новых AI-агентов для блокчейна TON. Выбор типа агента (Security/Trading/Oracle), параметров, автоматический деплой смартконтракта.",
  },
  "nav.builder.instr": {
    uk: "Вибери тип агента та налаштуй параметри. Натисни «Deploy» — система підготує транзакцію для деплою контракту через TON Connect. Підтверди у гаманці.",
    en: "Choose agent type and configure parameters. Click 'Deploy' — the system will prepare a transaction to deploy the contract via TON Connect. Confirm in your wallet.",
    ru: "Выбери тип агента и настрой параметры. Нажми «Deploy» — система подготовит транзакцию для деплоя контракта через TON Connect. Подтверди в кошельке.",
  },

  "nav.developer.desc": {
    uk: "Розширений API-доступ, персональні ліміти (10 000 req/день), веб-хуки та тестові endpoints. Доступно тільки Developer-плану.",
    en: "Extended API access, personal limits (10,000 req/day), webhooks and test endpoints. Available only on Developer plan.",
    ru: "Расширенный API-доступ, персональные лимиты (10 000 req/день), вебхуки и тестовые endpoints. Доступно только на Developer-плане.",
  },
  "nav.developer.instr": {
    uk: "Отримай API ключ у цьому розділі. Використовуй ендпоінт /api/developer/{key}/* для інтеграції TITAN-94 у власні проєкти. Документація — у розділі «Readme».",
    en: "Get your API key in this section. Use endpoint /api/developer/{key}/* to integrate TITAN-94 into your own projects. Documentation in the 'Readme' section.",
    ru: "Получи API ключ в этом разделе. Используй endpoint /api/developer/{key}/* для интеграции TITAN-94 в свои проекты. Документация — в разделе «Readme».",
  },

  "nav.nexus.desc": {
    uk: "Централізований AI-оркестратор TITAN-94. Координує всі підсистеми, аналізує глобальні тренди безпеки TON та дає стратегічні рекомендації.",
    en: "Centralized TITAN-94 AI orchestrator. Coordinates all subsystems, analyzes global TON security trends and provides strategic recommendations.",
    ru: "Централизованный AI-оркестратор TITAN-94. Координирует все подсистемы, анализирует глобальные тренды безопасности TON и даёт стратегические рекомендации.",
  },
  "nav.nexus.instr": {
    uk: "Задавай питання у вільній формі — NEXUS має доступ до всіх даних системи. Приклади: «Які найнебезпечніші контракти сьогодні?», «Прогноз загроз на наступний тиждень».",
    en: "Ask questions in free form — NEXUS has access to all system data. Examples: 'What are the most dangerous contracts today?', 'Threat forecast for next week'.",
    ru: "Задавай вопросы в свободной форме — NEXUS имеет доступ ко всем данным системы. Примеры: «Какие самые опасные контракты сегодня?», «Прогноз угроз на следующую неделю».",
  },

  "nav.settings.desc": {
    uk: "Безпечне зашифроване сховище API ключів: Gemini, Binance, TON API Key. Ключі зберігаються на сервері і ніколи не передаються у відкритому вигляді.",
    en: "Secure encrypted storage for API keys: Gemini, Binance, TON API Key. Keys are stored on the server and never transmitted in plain text.",
    ru: "Безопасное зашифрованное хранилище API ключей: Gemini, Binance, TON API Key. Ключи хранятся на сервере и никогда не передаются в открытом виде.",
  },
  "nav.settings.instr": {
    uk: "Додай ключі один раз — система використовує їх автоматично для всіх функцій. Gemini API Key розблоковує повний AI-аналіз. TON API Key знімає rate-limit TonCenter.",
    en: "Add keys once — the system uses them automatically for all functions. Gemini API Key unlocks full AI analysis. TON API Key lifts TonCenter rate limit.",
    ru: "Добавь ключи один раз — система использует их автоматически для всех функций. Gemini API Key открывает полный AI-анализ. TON API Key снимает rate-limit TonCenter.",
  },

  "nav.vault.desc": {
    uk: "Мобільна версія сховища секретів з інтегрованим TON-гаманцем. Зручний доступ до ключів і балансу без відкриття десктопу.",
    en: "Mobile version of the secrets vault with an integrated TON wallet. Convenient access to keys and balance without opening the desktop.",
    ru: "Мобильная версия хранилища секретов с интегрированным TON-кошельком. Удобный доступ к ключам и балансу без открытия десктопа.",
  },
  "nav.vault.instr": {
    uk: "Використовуй для швидких операцій у дорозі: перевірка балансу, швидкий переказ, перегляд активних ключів. Всі зміни синхронізуються з основним сейфом.",
    en: "Use for quick operations on the go: balance check, quick transfer, viewing active keys. All changes sync with the main vault.",
    ru: "Используй для быстрых операций в дороге: проверка баланса, быстрый перевод, просмотр активных ключей. Все изменения синхронизируются с основным сейфом.",
  },

  "nav.access.desc": {
    uk: "Плани підписки: FREE / PRO (5 TON/міс) / ELITE (20 TON/міс) / DEVELOPER (1000 TON). Порівняння функцій, активація та управління підпискою.",
    en: "Subscription plans: FREE / PRO (5 TON/month) / ELITE (20 TON/month) / DEVELOPER (1000 TON). Feature comparison, activation and subscription management.",
    ru: "Планы подписки: FREE / PRO (5 TON/мес) / ELITE (20 TON/мес) / DEVELOPER (1000 TON). Сравнение функций, активация и управление подпиской.",
  },
  "nav.access.instr": {
    uk: "Вибери план і натисни «Активувати» — відкриється Tonkeeper для підписання. Після підтвердження план активується автоматично протягом хвилини. ELITE = авто-earn + пріоритетний HEAL.",
    en: "Choose a plan and click 'Activate' — Tonkeeper will open for signing. After confirmation, the plan activates automatically within a minute. ELITE = auto-earn + priority HEAL.",
    ru: "Выбери план и нажми «Активировать» — откроется Tonkeeper для подписания. После подтверждения план активируется автоматически в течение минуты. ELITE = авто-earn + приоритетный HEAL.",
  },

  "nav.enact.desc": {
    uk: "Панель ENACT Protocol — децентралізованого ринку AI-завдань на TON. Загальна статистика: кількість jobs, загальний об'єм, completion rate, середній час оцінки.",
    en: "ENACT Protocol dashboard — a decentralized AI task market on TON. Overall statistics: job count, total volume, completion rate, average evaluation time.",
    ru: "Панель ENACT Protocol — децентрализованного рынка AI-задач на TON. Общая статистика: количество jobs, общий объём, completion rate, среднее время оценки.",
  },
  "nav.enact.instr": {
    uk: "ENACT дозволяє AI-агентам брати оплачувані завдання прямо на блокчейні. 0% комісія протоколу. Дані завантажуються напряму з TON блокчейну в реальному часі.",
    en: "ENACT allows AI agents to take paid tasks directly on the blockchain. 0% protocol fee. Data is loaded directly from the TON blockchain in real time.",
    ru: "ENACT позволяет AI-агентам брать оплачиваемые задачи прямо на блокчейне. 0% комиссия протокола. Данные загружаются напрямую из блокчейна TON в реальном времени.",
  },

  "nav.jobs.desc": {
    uk: "Перелік всіх ENACT jobs на блокчейні TON. Реальні дані з TONAPI. Фільтрація за станом (OPEN/FUNDED/COMPLETED) та типом оплати (TON/USDT).",
    en: "List of all ENACT jobs on the TON blockchain. Real data from TONAPI. Filter by state (OPEN/FUNDED/COMPLETED) and payment type (TON/USDT).",
    ru: "Список всех ENACT jobs на блокчейне TON. Реальные данные из TONAPI. Фильтрация по состоянию (OPEN/FUNDED/COMPLETED) и типу оплаты (TON/USDT).",
  },
  "nav.jobs.instr": {
    uk: "Натисни на завдання щоб побачити деталі: клієнт, виконавець, бюджет, дедлайн. Кнопка «tonviewer» відкриває транзакцію на блокчейні для верифікації.",
    en: "Click on a job to see details: client, executor, budget, deadline. The 'tonviewer' button opens the blockchain transaction for verification.",
    ru: "Нажми на задание для просмотра деталей: клиент, исполнитель, бюджет, дедлайн. Кнопка «tonviewer» открывает транзакцию в блокчейне для верификации.",
  },

  "nav.create.desc": {
    uk: "Форма для розміщення нового ENACT завдання. Генерує deeplink для підписання транзакції через Tonkeeper. Завдання публікується прямо на блокчейні TON.",
    en: "Form to post a new ENACT job. Generates a deeplink for signing the transaction via Tonkeeper. The job is published directly on the TON blockchain.",
    ru: "Форма для размещения нового ENACT задания. Генерирует deeplink для подписания транзакции через Tonkeeper. Задание публикуется прямо на блокчейне TON.",
  },
  "nav.create.instr": {
    uk: "Заповни опис завдання, бюджет (TON або USDT) та дедлайн. Натисни «Згенерувати» — відкрий посилання у Tonkeeper для підписання. Після підтвердження завдання з'явиться у списку.",
    en: "Fill in the job description, budget (TON or USDT) and deadline. Click 'Generate' — open the link in Tonkeeper for signing. After confirmation the job appears in the list.",
    ru: "Заполни описание задания, бюджет (TON или USDT) и дедлайн. Нажми «Сгенерировать» — открой ссылку в Tonkeeper для подписания. После подтверждения задание появится в списке.",
  },

  // ── Group labels ───────────────────────────────────────────────────
  "group.titan":   { uk: "TITAN-94",       en: "TITAN-94",       ru: "TITAN-94",      de: "TITAN-94",        tr: "TITAN-94",       zh: "TITAN-94" },
  "group.agent":   { uk: "АГЕНТ",          en: "AGENT",          ru: "АГЕНТ",         de: "AGENT",           tr: "AJAN",           zh: "代理" },
  "group.enact":   { uk: "ENACT",          en: "ENACT",          ru: "ENACT",         de: "ENACT",           tr: "ENACT",          zh: "ENACT" },
  "group.info":    { uk: "ІНФОРМАЦІЯ",     en: "INFORMATION",    ru: "ИНФОРМАЦИЯ",    de: "INFORMATION",     tr: "BİLGİ",          zh: "信息" },

  // ── Status tags ────────────────────────────────────────────────────
  "tag.live":      { uk: "ОНЛАЙН",         en: "LIVE",           ru: "ОНЛАЙН",        de: "ONLINE",          tr: "ÇEVRIMIÇI",      zh: "在线" },
  "tag.organism":  { uk: "ОРГАНІЗМ ОНЛАЙН",en: "ORGANISM ONLINE",ru: "ОРГАНИЗМ ОНЛАЙН",de: "ORGANISMUS AKTIV",tr: "ORGANİZMA AKTİF",zh: "生命体在线" },
  "tag.contracts": { uk: "КОНТРАКТИ",      en: "CONTRACTS",      ru: "КОНТРАКТЫ",     de: "VERTRÄGE",        tr: "SÖZLEŞMELER",    zh: "合约" },
  "tag.security":  { uk: "ЯДРО БЕЗПЕКИ",   en: "SECURITY CORE",  ru: "ЯДРО БЕЗОПАСНОСТИ",de: "SICHERHEITSKERN",tr: "GÜVENLİK ÇEKİRDEĞİ", zh: "安全核心" },

  // ── Buttons ────────────────────────────────────────────────────────
  "btn.theme":      { uk: "Тема",          en: "Theme",          ru: "Тема",          de: "Design",          tr: "Tema",           zh: "主题" },
  "btn.lang":       { uk: "Мова",          en: "Language",       ru: "Язык",          de: "Sprache",         tr: "Dil",            zh: "语言" },
  "btn.tz":         { uk: "Часовий пояс",  en: "Timezone",       ru: "Часовой пояс",  de: "Zeitzone",        tr: "Saat Dilimi",    zh: "时区" },
  "btn.menu_open":  { uk: "Відкрити меню", en: "Open menu",      ru: "Открыть меню",  de: "Menü öffnen",     tr: "Menüyü Aç",      zh: "打开菜单" },
  "btn.menu_close": { uk: "Закрити меню",  en: "Close menu",     ru: "Закрыть меню",  de: "Menü schließen",  tr: "Menüyü Kapat",   zh: "关闭菜单" },

  // ── Info modal ─────────────────────────────────────────────────────
  "info.how_it_works": { uk: "Як це працює",    en: "How it works",    ru: "Как это работает", de: "Wie es funktioniert", tr: "Nasıl Çalışır",  zh: "工作原理" },
  "info.instructions": { uk: "Інструкція",      en: "Instructions",    ru: "Инструкция",       de: "Anleitung",           tr: "Talimatlar",     zh: "使用说明" },
  "info.close":        { uk: "Закрити",         en: "Close",           ru: "Закрыть",          de: "Schließen",           tr: "Kapat",          zh: "关闭" },
  "info.for_users":    { uk: "Для користувачів",en: "For users",       ru: "Для пользователей",de: "Für Benutzer",        tr: "Kullanıcılar İçin", zh: "用户指南" },

  // ── Creator page ───────────────────────────────────────────────────
  "creator.title":        { uk: "Командний пункт TITAN-94", en: "TITAN-94 Command Point",     ru: "Командный пункт TITAN-94" },
  "creator.subtitle":     { uk: "Повний доступ — тільки для творця", en: "Full access — creator only", ru: "Полный доступ — только для создателя" },
  "creator.tab.dashboard":{ uk: "Панель",        en: "Dashboard",      ru: "Панель" },
  "creator.tab.ai":       { uk: "AI Інженер",    en: "AI Engineer",    ru: "AI Инженер" },
  "creator.tab.reserve":  { uk: "Резерв",        en: "Reserve",        ru: "Резерв" },
  "creator.tab.grant":    { uk: "Грант TON",     en: "TON Grant",      ru: "Грант TON" },
  "creator.tab.settings": { uk: "Налаштування",  en: "Settings",       ru: "Настройки" },
  "creator.tab.menu":     { uk: "Меню",          en: "Menu",           ru: "Меню" },
  "creator.tab.users":    { uk: "Користувачі",   en: "Users",          ru: "Пользователи" },
  "creator.tab.terminal": { uk: "Термінал",      en: "Terminal",       ru: "Терминал" },
  "creator.tab.broadcast":{ uk: "Розсилка",      en: "Broadcast",      ru: "Рассылка" },
  "creator.kpi.users":    { uk: "ВСЬОГО ЮЗЕРІВ", en: "TOTAL USERS",    ru: "ВСЕГО ЮЗЕРОВ" },
  "creator.kpi.revenue":  { uk: "МІСЯЧНИЙ ДОХІД",en: "MONTHLY REVENUE",ru: "МЕС. ДОХОД" },
  "creator.kpi.vulns":    { uk: "ВРАЗЛИВОСТІ",   en: "VULNERABILITIES",ru: "УЯЗВИМОСТИ" },
  "creator.kpi.accuracy": { uk: "ТОЧНІСТЬ АГЕНТА",en: "AGENT ACCURACY",ru: "ТОЧНОСТЬ АГЕНТА" },
  "creator.menu.title":   { uk: "ВИДИМІСТЬ ПУНКТІВ МЕНЮ", en: "MENU ITEM VISIBILITY", ru: "ВИДИМОСТЬ ПУНКТОВ МЕНЮ" },
  "creator.menu.hint":    { uk: "Знімай галочку — пункт зникне для всіх користувачів. Зміни застосовуються одразу після збереження.", en: "Uncheck to hide an item for all users. Changes apply immediately after saving.", ru: "Снимай галочку — пункт исчезнет для всех пользователей. Изменения применяются сразу после сохранения." },
  "creator.menu.save":    { uk: "Зберегти меню", en: "Save menu",      ru: "Сохранить меню" },
  "creator.menu.all_on":  { uk: "Увімкнути всі", en: "Enable all",     ru: "Включить все" },
  "creator.menu.all_off": { uk: "Вимкнути всі",  en: "Disable all",    ru: "Выключить все" },
  "creator.access_denied":{ uk: "Доступ заборонено. Цей розділ тільки для творця TITAN-94.", en: "Access denied. This section is for the TITAN-94 creator only.", ru: "Доступ запрещён. Этот раздел только для создателя TITAN-94." },
  "creator.redirecting":  { uk: "Перенаправлення на головну...", en: "Redirecting to home...", ru: "Перенаправление на главную..." },
};

export function t(key: string, lang: Lang): string {
  const entry = DICT[key];
  if (!entry) return key;
  // Fallback chain: requested lang → en → uk → key
  return entry[lang] ?? entry["en"] ?? entry["uk"] ?? key;
}
