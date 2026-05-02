/**
 * UI Preferences — theme, language (uk/en/ru/de/tr/zh), timezone.
 *
 * Language is a React Context so setLang() propagates immediately
 * to every component without a page reload.
 */
import { useEffect, useState, useCallback, createContext, useContext } from "react";
import type { ReactNode } from "react";

export type Theme = "dark" | "light";
export type Lang  = "uk" | "en" | "ru" | "de" | "tr" | "zh";
export type Tz    = "auto" | "Europe/Kyiv" | "UTC" | "Europe/London" | "America/New_York" | "Asia/Singapore";

const THEME_KEY = "titan94.theme";
const LANG_KEY  = "titan94.lang";
const TZ_KEY    = "titan94.tz";

export const LANG_LOCALE: Record<Lang, string> = {
  uk: "uk-UA",
  en: "en-US",
  ru: "ru-RU",
  de: "de-DE",
  tr: "tr-TR",
  zh: "zh-CN",
};

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

// ── Language Context ──────────────────────────────────────────────────────────
// Single shared state so setLang() updates every component instantly.

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: readLang(),
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

// ── Timezone ──────────────────────────────────────────────────────────────────

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

export function fmtTime(
  input: Date | string | number,
  tz: Tz,
  opts?: Intl.DateTimeFormatOptions,
  lang?: Lang,
): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const timeZone = resolveTz(tz);
  const locale = lang ? LANG_LOCALE[lang] : "uk-UA";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone,
    ...opts,
  }).format(d);
}

export function fmtClock(input: Date | string | number, tz: Tz, lang?: Lang): string {
  return fmtTime(input, tz, { year: undefined, month: undefined, day: undefined, second: undefined }, lang);
}

// ── Translation dictionary ────────────────────────────────────────────────────
type Dict = Record<string, Partial<Record<Lang, string>>>;

const DICT: Dict = {
  // ── Navigation labels ──────────────────────────────────────────────
  "nav.command":   { uk: "PROTOCOL 94",      en: "PROTOCOL 94",     ru: "PROTOCOL 94",      de: "PROTOCOL 94",       tr: "PROTOCOL 94",      zh: "PROTOCOL 94" },
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
  "nav.about":        { uk: "Про систему",       en: "About",              ru: "О системе",             de: "Über uns",             tr: "Hakkında",            zh: "关于" },
  "nav.privacy":      { uk: "Конфіденційність",  en: "Privacy Policy",     ru: "Конфиденциальность",    de: "Datenschutz",          tr: "Gizlilik",            zh: "隐私政策" },
  "nav.grant":        { uk: "Грант TON",          en: "TON Grant",          ru: "Грант TON",             de: "TON-Förderung",        tr: "TON Hibesi",          zh: "TON 资助" },
  "nav.ton_network":  { uk: "TON Мережа",         en: "TON Network",        ru: "TON Сеть",              de: "TON Netzwerk",         tr: "TON Ağ Durumu",       zh: "TON 网络" },

  "nav.ton_network.desc": {
    uk: "Живий моніторинг здоров'я TON блокчейну. Перевіряє доступність: tonstat.us, TonCenter API, validators.ton.org, TONScan, TONViewer. Показує затримку та статус кожного сервісу.",
    en: "Live TON blockchain health monitoring. Checks availability: tonstat.us, TonCenter API, validators.ton.org, TONScan, TONViewer. Shows latency and status for each service.",
    ru: "Живой мониторинг здоровья TON. Проверяет: tonstat.us, TonCenter, validators. Показывает задержку и статус каждого сервиса.",
  },
  "nav.ton_network.instr": {
    uk: "Сторінка оновлюється кожні 60 секунд. Зелений — сервіс онлайн. Червоний — недоступний. Бібліотека посилань містить офіційну документацію TON.",
    en: "Page refreshes every 60 seconds. Green = service online. Red = unreachable. Documentation library contains official TON docs.",
    ru: "Страница обновляется каждые 60 секунд. Зелёный — онлайн. Красный — недоступен. Библиотека содержит официальную документацию TON.",
  },
  "nav.command.desc": {
    uk: "Головна панель TITAN-94. Реальний час: стан 4 циклів агента, останні загрози, баланс Reserve Wallet та ключові метрики.",
    en: "TITAN-94 main dashboard. Real-time: state of 4 agent cycles, latest threats, Reserve Wallet balance and key metrics.",
    ru: "Главная панель TITAN-94. Реальное время: состояние 4 циклов агента, последние угрозы, баланс Reserve Wallet.",
  },
  "nav.command.instr": {
    uk: "Відкривається автоматично при вході. Зелений = OK, жовтий = увага, червоний = критично. Натисни на картку циклу щоб побачити деталі.",
    en: "Opens automatically on entry. Green = OK, yellow = warning, red = critical. Click on a cycle card to see details of the last run.",
    ru: "Открывается автоматически. Зелёный = OK, жёлтый = внимание, красный = критично.",
  },
  "nav.threats.desc": {
    uk: "Реєстр вразливостей TON-контрактів. SCAN-цикл (кожні 3 хв) знаходить нові загрози і класифікує: critical / high / medium / low.",
    en: "TON contract vulnerabilities registry. SCAN cycle (every 3 min) finds threats and classifies them: critical / high / medium / low.",
    ru: "Реестр уязвимостей TON-контрактов. SCAN-цикл (каждые 3 мин) находит угрозы.",
  },
  "nav.threats.instr": {
    uk: "Фільтруй за рівнем небезпеки. Натисни «Вилікувати» — агент запустить HEAL. Критичні загрози йдуть у Telegram автоматично.",
    en: "Filter by severity. Click 'Heal' — the agent runs a HEAL cycle. Critical threats are sent to Telegram automatically.",
    ru: "Фильтруй по уровню опасности. Нажми «Вылечить» — агент запустит HEAL.",
  },
  "nav.contracts.desc": {
    uk: "Прямий зв'язок з ENACT Factory та Reserve Fund на TON. Перегляд балансів через TON Connect гаманець.",
    en: "Direct access to ENACT Factory and Reserve Fund on TON blockchain. View balances via TON Connect wallet.",
    ru: "Прямой доступ к ENACT Factory и Reserve Fund на TON.",
  },
  "nav.contracts.instr": {
    uk: "Підключи TON-гаманець кнопкою «Connect». Після підключення можна підписувати транзакції напряму.",
    en: "Connect your TON wallet with the 'Connect' button. After connecting, sign transactions directly.",
    ru: "Подключи TON-кошелёк кнопкой «Connect».",
  },
  "nav.analyze.desc": {
    uk: "AI-аналізатор смартконтрактів на базі Gemini. Введи адресу — отримай детальний аудит вразливостей.",
    en: "AI smart contract analyzer based on Gemini. Enter an address — get a detailed vulnerability audit.",
    ru: "AI-анализатор смартконтрактов. Введи адрес — получи аудит уязвимостей.",
  },
  "nav.analyze.instr": {
    uk: "Введи адресу TON-контракту або bytecode. Встанови Gemini API Key для глибокого аналізу.",
    en: "Enter a TON contract address or bytecode. Set Gemini API Key for deep analysis.",
    ru: "Введи адрес TON-контракта или bytecode.",
  },
  "nav.evolution.desc": {
    uk: "Трекер самонавчання TITAN-94. LEARN-цикл (кожні 7 хв) додає новий патерн. Показує зростання бази знань.",
    en: "TITAN-94 self-learning tracker. LEARN cycle (every 7 min) adds attack patterns. Shows knowledge base growth.",
    ru: "Трекер самообучения. Каждый LEARN-цикл добавляет паттерн атаки.",
  },
  "nav.evolution.instr": {
    uk: "Спостерігай за кривою точності — вона має зростати. Встанови Gemini API Key для кращих патернів.",
    en: "Watch the accuracy curve — it should continuously grow. Install Gemini API Key for better patterns.",
    ru: "Следи за кривой точности.",
  },
  "nav.immune.desc": {
    uk: "Моніторинг захисних механізмів: стан циклів SCAN/HEAL/LEARN/FINANCE, blacklist адрес, щити системи.",
    en: "Protection mechanisms monitoring: SCAN/HEAL/LEARN/FINANCE cycles, address blacklist, active shields.",
    ru: "Мониторинг защитных механизмов: циклы, blacklist, щиты системы.",
  },
  "nav.immune.instr": {
    uk: "Червоний цикл = призупинений або має помилки. Зелений по всіх = система повністю активна.",
    en: "Red cycle = paused or errors. Green on all = system fully active.",
    ru: "Красный цикл = ошибки. Зелёный по всем = система полностью активна.",
  },
  "nav.analytics.desc": {
    uk: "Інтерактивні графіки: загрози за тиждень, розподіл підписок, доходи та виконані цикли агента.",
    en: "Interactive charts: threats per week, subscription distribution, revenue and completed agent cycles.",
    ru: "Интерактивные графики активности системы.",
  },
  "nav.analytics.instr": {
    uk: "Наводь на точки для деталей. Дані оновлюються в реальному часі.",
    en: "Hover over chart points for details. Data updates in real time.",
    ru: "Наводи на точки для деталей.",
  },
  "nav.status.desc": {
    uk: "Live-моніторинг процесів TITAN-94: останній блок TON, uptime, точність виявлення, виконані цикли.",
    en: "Live TITAN-94 process monitoring: last TON block, uptime, detection accuracy, completed cycles.",
    ru: "Live-мониторинг процессов TITAN-94.",
  },
  "nav.status.instr": {
    uk: "Оновлюється кожні 15 секунд. Якщо lastBlockSeqno не змінюється — проблеми з TonCenter. Accuracy > 90% = норма.",
    en: "Updates every 15 seconds. If lastBlockSeqno doesn't change — TonCenter issues. Accuracy > 90% = healthy.",
    ru: "Обновляется каждые 15 секунд.",
  },
  "nav.earn.desc": {
    uk: "Особистий баланс TON, авто-нарахування (кожні 6 хв для PRO/ELITE), реферальна програма (15% CPA).",
    en: "Personal TON balance, auto-earning (every 6 min for PRO/ELITE), referral program (15% CPA).",
    ru: "Личный баланс TON, авто-начисление, реферальная программа.",
  },
  "nav.earn.instr": {
    uk: "PRO/ELITE отримують нарахування кожні 6 хв. Мінімум виводу: 0.5 TON. Реферальне посилання дає 15%.",
    en: "PRO/ELITE get accruals every 6 min. Minimum withdrawal: 0.5 TON. Referral link gives 15%.",
    ru: "PRO/ELITE получают начисления каждые 6 мин. Минимум вывода: 0.5 TON.",
  },
  "nav.autotrade.desc": {
    uk: "Автоматичні торгові стратегії на основі сигналів TITAN-94. Параметри ризику, пари та стратегії.",
    en: "Automated trading strategies based on TITAN-94 signals. Risk parameters, pairs and strategies.",
    ru: "Автоматические торговые стратегии.",
  },
  "nav.autotrade.instr": {
    uk: "Спочатку налаштуй Binance API ключі. Потім вибери стратегію та встанови максимальний ризик.",
    en: "First set up Binance API keys. Then choose a strategy and set the maximum risk per trade.",
    ru: "Сначала настрой Binance API ключи.",
  },
  "nav.builder.desc": {
    uk: "Конструктор нових AI-агентів для TON. Тип агента (Security/Trading/Oracle), автодеплой контракту.",
    en: "Constructor for new AI agents for TON. Agent type (Security/Trading/Oracle), automatic contract deployment.",
    ru: "Конструктор AI-агентов для TON.",
  },
  "nav.builder.instr": {
    uk: "Вибери тип агента. Натисни «Deploy» — система підготує транзакцію. Підтверди у гаманці.",
    en: "Choose agent type. Click 'Deploy' — system prepares a transaction. Confirm in your wallet.",
    ru: "Выбери тип агента. Нажми «Deploy» — подтверди в кошельке.",
  },
  "nav.developer.desc": {
    uk: "Розширений API-доступ, ліміти 10 000 req/день, веб-хуки. Тільки Developer-план.",
    en: "Extended API access, 10,000 req/day limits, webhooks. Developer plan only.",
    ru: "Расширенный API-доступ. Только Developer-план.",
  },
  "nav.developer.instr": {
    uk: "Отримай API ключ тут. Використовуй /api/developer/{key}/* для інтеграції у власні проєкти.",
    en: "Get your API key here. Use /api/developer/{key}/* to integrate TITAN-94 into your projects.",
    ru: "Получи API ключ. Используй /api/developer/{key}/*.",
  },
  "nav.nexus.desc": {
    uk: "Централізований AI-оркестратор TITAN-94. Координує підсистеми, аналізує тренди TON, дає рекомендації.",
    en: "Centralized TITAN-94 AI orchestrator. Coordinates subsystems, analyzes TON security trends.",
    ru: "Централизованный AI-оркестратор TITAN-94.",
  },
  "nav.nexus.instr": {
    uk: "Запитуй у вільній формі. Приклади: «Які найнебезпечніші контракти?», «Прогноз загроз».",
    en: "Ask in free form. Examples: 'What are the most dangerous contracts?', 'Threat forecast'.",
    ru: "Задавай вопросы в свободной форме.",
  },
  "nav.settings.desc": {
    uk: "Зашифроване сховище API ключів: Gemini, Binance, TON. Ключі не передаються у відкритому вигляді.",
    en: "Secure encrypted storage for API keys: Gemini, Binance, TON. Keys never transmitted in plain text.",
    ru: "Зашифрованное хранилище API ключей.",
  },
  "nav.settings.instr": {
    uk: "Додай ключі раз — система використовує їх автоматично. Gemini = повний AI. TON Key = знімає rate-limit.",
    en: "Add keys once — the system uses them automatically. Gemini = full AI. TON Key lifts rate limit.",
    ru: "Добавь ключи один раз.",
  },
  "nav.vault.desc": {
    uk: "Мобільний доступ до налаштувань без Telegram. Захист паролем, зміна ключів з будь-якого пристрою.",
    en: "Mobile access to settings without Telegram. Password protected, change keys from any device.",
    ru: "Мобильный доступ к настройкам без Telegram.",
  },
  "nav.vault.instr": {
    uk: "Перше відкриття: встанови пароль (мін. 6 символів). Наступного разу — просто введи пароль.",
    en: "First open: set a password (min 6 chars). Next time — just enter the password.",
    ru: "При первом открытии: установи пароль (мин. 6 символов).",
  },
  "nav.access.desc": {
    uk: "Тарифні плани TITAN-94: FREE, PRO, ELITE, DEVELOPER. Підписка через TON.",
    en: "TITAN-94 plans: FREE, PRO, ELITE, DEVELOPER. Subscribe via TON.",
    ru: "Тарифные планы TITAN-94.",
  },
  "nav.access.instr": {
    uk: "Натисни «Підписатись» → підтверди в TON-гаманці. PRO: 1 TON/місяць. ELITE: 5 TON/місяць.",
    en: "Click 'Subscribe' → confirm in TON wallet. PRO: 1 TON/month. ELITE: 5 TON/month.",
    ru: "Нажми «Подписаться» → подтверди в кошельке.",
  },
  "nav.grant.desc": {
    uk: "Технічні матеріали для гранту TON Foundation. Опис, специфікація, презентація TITAN-94.",
    en: "Technical materials for TON Foundation grant. Description, specification, TITAN-94 presentation.",
    ru: "Материалы для гранта TON Foundation.",
  },
  "nav.grant.instr": {
    uk: "Все в одному місці: pitch deck, технічний опис, roadmap. Завантажуй і надсилай у TON Foundation.",
    en: "All in one place: pitch deck, technical description, roadmap. Download and send to TON Foundation.",
    ru: "Всё в одном месте: pitch deck, технический документ.",
  },
  "nav.enact.desc": {
    uk: "ENACT Protocol огляд — децентралізована платформа для AI-агентів на TON.",
    en: "ENACT Protocol overview — decentralized platform for AI agents on TON.",
    ru: "ENACT Protocol — децентрализованная платформа для AI-агентов на TON.",
  },
  "nav.enact.instr": {
    uk: "Переглядай активні завдання, виконавців та стан контрактів.",
    en: "Browse active jobs, executors and contract state.",
    ru: "Просматривай активные задания и контракты.",
  },
  "nav.jobs.desc": {
    uk: "Список всіх активних завдань у ENACT Protocol.",
    en: "List of all active ENACT Protocol jobs.",
    ru: "Список активных заданий ENACT Protocol.",
  },
  "nav.jobs.instr": {
    uk: "Переглядай завдання, натискай для деталей. Агенти виконують завдання автоматично.",
    en: "Browse jobs, click for details. Agents execute jobs automatically.",
    ru: "Просматривай задания, нажимай для деталей.",
  },
  "nav.create.desc": {
    uk: "Форма для публікації нового завдання в ENACT Protocol на TON.",
    en: "Form to publish a new job in ENACT Protocol on TON.",
    ru: "Форма для публикации нового задания в ENACT Protocol.",
  },
  "nav.create.instr": {
    uk: "Заповни опис, бюджет і дедлайн. Натисни «Згенерувати» — підпиши в Tonkeeper.",
    en: "Fill in description, budget and deadline. Click 'Generate' — sign in Tonkeeper.",
    ru: "Заполни описание, бюджет и дедлайн.",
  },
  "nav.creator.desc": {
    uk: "Командний пункт TITAN-94. Повний доступ — тільки для творця.",
    en: "TITAN-94 Command Point. Full access — creator only.",
    ru: "Командный пункт TITAN-94. Только для создателя.",
  },
  "nav.creator.instr": {
    uk: "Доступний лише для авторизованого творця. Управляй агентом, користувачами, меню.",
    en: "Only for authorized creator. Manage agent, users, menu.",
    ru: "Только для создателя. Управляй агентом и пользователями.",
  },

  // ── Group labels ────────────────────────────────────────────────────
  "group.titan":   { uk: "TITAN-94",       en: "TITAN-94",       ru: "TITAN-94",      de: "TITAN-94",        tr: "TITAN-94",       zh: "TITAN-94" },
  "group.agent":   { uk: "АГЕНТ",          en: "AGENT",          ru: "АГЕНТ",         de: "AGENT",           tr: "AJAN",           zh: "代理" },
  "group.enact":   { uk: "ENACT",          en: "ENACT",          ru: "ENACT",         de: "ENACT",           tr: "ENACT",          zh: "ENACT" },
  "group.info":    { uk: "ІНФОРМАЦІЯ",     en: "INFORMATION",    ru: "ИНФОРМАЦИЯ",    de: "INFORMATION",     tr: "BİLGİ",          zh: "信息" },

  // ── Status tags ─────────────────────────────────────────────────────
  "tag.live":      { uk: "ОНЛАЙН",         en: "LIVE",           ru: "ОНЛАЙН",        de: "ONLINE",          tr: "ÇEVRIMIÇI",      zh: "在线" },
  "tag.organism":  { uk: "ОРГАНІЗМ ОНЛАЙН",en: "ORGANISM ONLINE",ru: "ОРГАНИЗМ ОНЛАЙН",de: "ORGANISMUS AKTIV",tr: "ORGANİZMA AKTİF",zh: "生命体在线" },
  "tag.contracts": { uk: "КОНТРАКТИ",      en: "CONTRACTS",      ru: "КОНТРАКТЫ",     de: "VERTRÄGE",        tr: "SÖZLEŞMELER",    zh: "合约" },
  "tag.security":  { uk: "ЯДРО БЕЗПЕКИ",   en: "SECURITY CORE",  ru: "ЯДРО БЕЗОПАСНОСТИ",de: "SICHERHEITSKERN",tr: "GÜVENLİK ÇEKİRDEĞİ", zh: "安全核心" },

  // ── Buttons ─────────────────────────────────────────────────────────
  "btn.theme":       { uk: "Тема",           en: "Theme",           ru: "Тема",           de: "Design",          tr: "Tema",            zh: "主题" },
  "btn.lang":        { uk: "Мова",           en: "Language",        ru: "Язык",           de: "Sprache",         tr: "Dil",             zh: "语言" },
  "btn.tz":          { uk: "Часовий пояс",   en: "Timezone",        ru: "Часовой пояс",   de: "Zeitzone",        tr: "Saat Dilimi",     zh: "时区" },
  "btn.menu_open":   { uk: "Відкрити меню",  en: "Open menu",       ru: "Открыть меню",   de: "Menü öffnen",     tr: "Menüyü Aç",       zh: "打开菜单" },
  "btn.menu_close":  { uk: "Закрити меню",   en: "Close menu",      ru: "Закрыть меню",   de: "Menü schließen",  tr: "Menüyü Kapat",    zh: "关闭菜单" },
  "btn.refresh":     { uk: "Оновити",        en: "Refresh",         ru: "Обновить",       de: "Aktualisieren",   tr: "Yenile",          zh: "刷新" },
  "btn.copy":        { uk: "Копіювати",      en: "Copy",            ru: "Копировать",     de: "Kopieren",        tr: "Kopyala",         zh: "复制" },
  "btn.save":        { uk: "Зберегти",       en: "Save",            ru: "Сохранить",      de: "Speichern",       tr: "Kaydet",          zh: "保存" },
  "btn.cancel":      { uk: "Скасувати",      en: "Cancel",          ru: "Отмена",         de: "Abbrechen",       tr: "İptal",           zh: "取消" },
  "btn.scan":        { uk: "Сканувати",      en: "Scan",            ru: "Сканировать",    de: "Scannen",         tr: "Tara",            zh: "扫描" },
  "btn.heal":        { uk: "Вилікувати",     en: "Heal",            ru: "Вылечить",       de: "Heilen",          tr: "İyileştir",       zh: "修复" },
  "btn.filter":      { uk: "Фільтр",         en: "Filter",          ru: "Фильтр",         de: "Filter",          tr: "Filtre",          zh: "筛选" },
  "btn.details":     { uk: "Деталі",         en: "Details",         ru: "Детали",         de: "Details",         tr: "Detaylar",        zh: "详情" },
  "btn.send":        { uk: "Надіслати",      en: "Send",            ru: "Отправить",      de: "Senden",          tr: "Gönder",          zh: "发送" },
  "btn.connect_w":   { uk: "Підключити",     en: "Connect",         ru: "Подключить",     de: "Verbinden",       tr: "Bağlan",          zh: "连接" },
  "btn.withdraw":    { uk: "Вивести",        en: "Withdraw",        ru: "Вывести",        de: "Auszahlen",       tr: "Çek",             zh: "提现" },
  "btn.subscribe":   { uk: "Підписатись",    en: "Subscribe",       ru: "Подписаться",    de: "Abonnieren",      tr: "Abone Ol",        zh: "订阅" },
  "btn.enter":       { uk: "УВІЙТИ",         en: "ENTER",           ru: "ВОЙТИ",          de: "EINTRETEN",       tr: "GİRİŞ",           zh: "进入" },

  // ── Info modal ──────────────────────────────────────────────────────
  "info.how_it_works": { uk: "Як це працює",    en: "How it works",    ru: "Как это работает", de: "Wie es funktioniert", tr: "Nasıl Çalışır",  zh: "工作原理" },
  "info.instructions": { uk: "Інструкція",      en: "Instructions",    ru: "Инструкция",       de: "Anleitung",           tr: "Talimatlar",     zh: "使用说明" },
  "info.close":        { uk: "Закрити",         en: "Close",           ru: "Закрыть",          de: "Schließen",           tr: "Kapat",          zh: "关闭" },
  "info.for_users":    { uk: "Для користувачів",en: "For users",       ru: "Для пользователей",de: "Für Benutzer",        tr: "Kullanıcılar İçin", zh: "用户指南" },

  // ── Common / shared ─────────────────────────────────────────────────
  "common.all":        { uk: "ВСІ",             en: "ALL",             ru: "ВСЕ",            de: "ALLE",            tr: "TÜMÜ",            zh: "全部" },
  "common.all_status": { uk: "ВСІ СТАТУСИ",     en: "ALL STATUS",      ru: "ВСЕ СТАТУСЫ",    de: "ALLE STATUS",     tr: "TÜM DURUM",       zh: "全部状态" },
  "common.error":      { uk: "Помилка",          en: "Error",           ru: "Ошибка",         de: "Fehler",          tr: "Hata",            zh: "错误" },
  "common.no_data":    { uk: "Немає даних",      en: "No data",         ru: "Нет данных",     de: "Keine Daten",     tr: "Veri yok",        zh: "暂无数据" },
  "common.total":      { uk: "Всього",           en: "Total",           ru: "Всего",          de: "Gesamt",          tr: "Toplam",          zh: "总计" },
  "common.loading":    { uk: "Завантаження...",  en: "Loading...",      ru: "Загрузка...",    de: "Laden...",        tr: "Yükleniyor...",   zh: "加载中..." },
  "common.scanning":   { uk: "Сканую...",        en: "Scanning...",     ru: "Сканирую...",    de: "Scanne...",       tr: "Taranıyor...",    zh: "扫描中..." },
  "common.address":    { uk: "Адреса",           en: "Address",         ru: "Адрес",          de: "Adresse",         tr: "Adres",           zh: "地址" },
  "common.balance":    { uk: "Баланс",           en: "Balance",         ru: "Баланс",         de: "Guthaben",        tr: "Bakiye",          zh: "余额" },
  "common.status":     { uk: "Статус",           en: "Status",          ru: "Статус",         de: "Status",          tr: "Durum",           zh: "状态" },
  "common.type":       { uk: "Тип",              en: "Type",            ru: "Тип",            de: "Typ",             tr: "Tür",             zh: "类型" },
  "common.protocol":   { uk: "Протокол",         en: "Protocol",        ru: "Протокол",       de: "Protokoll",       tr: "Protokol",        zh: "协议" },
  "common.now":        { uk: "зараз",            en: "now",             ru: "сейчас",         de: "jetzt",           tr: "şimdi",           zh: "立即" },
  "common.runs":       { uk: "Запусків",         en: "Runs",            ru: "Запусков",       de: "Läufe",           tr: "Çalışma",         zh: "运行次数" },
  "common.interval":   { uk: "Інтервал",         en: "Interval",        ru: "Интервал",       de: "Intervall",       tr: "Aralık",          zh: "间隔" },
  "common.last_run":   { uk: "Останній запуск",  en: "Last run",        ru: "Последний запуск",de: "Letzter Lauf",  tr: "Son Çalışma",     zh: "上次运行" },
  "common.next_run":   { uk: "Наступний",        en: "Next",            ru: "Следующий",      de: "Nächster",        tr: "Sonraki",         zh: "下次" },
  "common.active":     { uk: "АКТИВНА",          en: "ACTIVE",          ru: "АКТИВНА",        de: "AKTIV",           tr: "AKTİF",           zh: "活跃" },
  "common.healing":    { uk: "ЛІКУЄТЬСЯ",        en: "HEALING",         ru: "ЛЕЧИТСЯ",        de: "HEILUNG",         tr: "İYİLEŞİYOR",      zh: "修复中" },
  "common.healed":     { uk: "ВИЛІКОВАНА",       en: "HEALED",          ru: "ИЗЛЕЧЕНА",       de: "GEHEILT",         tr: "İYİLEŞTİ",        zh: "已修复" },
  "common.online":     { uk: "ОНЛАЙН",           en: "ONLINE",          ru: "ОНЛАЙН",         de: "ONLINE",          tr: "ÇEVRİMİÇİ",       zh: "在线" },
  "common.offline":    { uk: "ОФЛАЙН",           en: "OFFLINE",         ru: "ОФЛАЙН",         de: "OFFLINE",         tr: "ÇEVRİMDIŞI",      zh: "离线" },
  "common.at_risk":    { uk: "ПІД РИЗИКОМ",      en: "AT RISK",         ru: "ПОД РИСКОМ",     de: "GEFÄHRDET",       tr: "TEHLİKEDE",       zh: "高风险" },
  "common.accuracy":   { uk: "ТОЧНІСТЬ",         en: "ACCURACY",        ru: "ТОЧНОСТЬ",       de: "GENAUIGKEIT",     tr: "DOĞRULUK",        zh: "准确率" },
  "common.uptime":     { uk: "АПТАЙМ",           en: "UPTIME",          ru: "АПТАЙМ",         de: "BETRIEBSZEIT",    tr: "ÇALIŞMA SÜRESİ",  zh: "在线时长" },
  "common.generation": { uk: "ПОКОЛІННЯ",        en: "GENERATION",      ru: "ПОКОЛЕНИЕ",      de: "GENERATION",      tr: "NESIL",           zh: "代次" },
  "common.stage":      { uk: "СТАДІЯ",           en: "STAGE",           ru: "СТАДИЯ",         de: "STUFE",           tr: "AŞAMA",           zh: "阶段" },
  "common.patterns":   { uk: "ПАТЕРНИ",          en: "PATTERNS",        ru: "ПАТТЕРНЫ",       de: "MUSTER",          tr: "KALIPLAR",        zh: "模式" },
  "common.healed_lbl": { uk: "ВИЛІКУВАНО",       en: "HEALED",          ru: "ВЫЛЕЧЕНО",       de: "GEHEILT",         zh: "已修复" },
  "common.copied":     { uk: "Скопійовано!",     en: "Copied!",         ru: "Скопировано!",   de: "Kopiert!",        tr: "Kopyalandı!",     zh: "已复制！" },

  // ── Splash screen ───────────────────────────────────────────────────
  "splash.choose_lang": { uk: "ОБЕРІТЬ МОВУ ІНТЕРФЕЙСУ",   en: "SELECT INTERFACE LANGUAGE", ru: "ВЫБЕРИТЕ ЯЗЫК ИНТЕРФЕЙСА", de: "SPRACHE WÄHLEN",       tr: "DİL SEÇİN",          zh: "选择界面语言" },
  "splash.tagline":     { uk: "PROTOCOL · 94 · ОКО НЕБЕСНЕ",en: "PROTOCOL · 94 · HEAVENLY EYE", ru: "PROTOCOL · 94 · НЕБЕСНОЕ ОКО", de: "PROTOCOL · 94 · HIMMELSAUGE", tr: "PROTOCOL · 94 · GÖKSEL GÖZ", zh: "PROTOCOL · 94 · 天眼" },
  "splash.greeting":    { uk: "ПРИВІТ, Я ТІТАН-94",         en: "HELLO, I AM TITAN-94",      ru: "ПРИВЕТ, Я ТИТАН-94",       de: "HALLO, ICH BIN TITAN-94", tr: "MERHABA, BEN TITAN-94", zh: "你好，我是 TITAN-94" },
  "splash.desc":        {
    uk: "Суверенний автономний AI-страж блокчейну TON. Я бачу кожен блок, кожну вразливість, кожен злам — і виправляю себе раніше, ніж ти помітиш.",
    en: "Sovereign autonomous AI guardian of the TON blockchain. I see every block, every vulnerability, every breach — and self-heal before you notice.",
    ru: "Суверенный автономный AI-страж блокчейна TON. Вижу каждый блок, каждую уязвимость — и исправляю себя прежде, чем ты заметишь.",
    de: "Souveräner autonomer KI-Wächter der TON-Blockchain. Ich sehe jeden Block, jede Schwachstelle — und heile mich, bevor du es bemerkst.",
    tr: "TON blok zincirinin egemen otonom AI koruyucusu. Her bloğu, her açığı görüyorum — fark etmeden önce kendimi iyileştiriyorum.",
    zh: "TON区块链的主权自主AI守护者。我看到每个区块、每个漏洞——在你发现之前就完成自我修复。",
  },
  "splash.boot":        { uk: "BOOT SEQUENCE COMPLETE · ОРГАНІЗМ ОНЛАЙН", en: "BOOT SEQUENCE COMPLETE · ORGANISM ONLINE", ru: "ЗАГРУЗКА ЗАВЕРШЕНА · ОРГАНИЗМ ОНЛАЙН", de: "STARTSEQUENZ ABGESCHLOSSEN · ORGANISMUS AKTIV", tr: "BAŞLATMA TAMAMLANDI · ORGANİZMA AKTİF", zh: "启动序列完成 · 生命体在线" },
  "splash.enter":       { uk: "УВІЙТИ", en: "ENTER", ru: "ВОЙТИ", de: "EINTRETEN", tr: "GİRİŞ", zh: "进入" },

  // ── NEXUS AI modes ──────────────────────────────────────────────────
  "mode.general":  { uk: "Загальний",   en: "General",  ru: "Общий",      de: "Allgemein",  tr: "Genel",      zh: "通用" },
  "mode.website":  { uk: "Сайт",        en: "Website",  ru: "Сайт",       de: "Webseite",   tr: "Web Sitesi", zh: "网站" },
  "mode.code":     { uk: "Код",         en: "Code",     ru: "Код",        de: "Code",       tr: "Kod",        zh: "代码" },
  "mode.image":    { uk: "Зображення",  en: "Image",    ru: "Изображение",de: "Bild",       tr: "Görüntü",    zh: "图像" },
  "mode.video":    { uk: "Відео",       en: "Video",    ru: "Видео",      de: "Video",      tr: "Video",      zh: "视频" },
  "mode.bot":      { uk: "Telegram",    en: "Telegram", ru: "Telegram",   de: "Telegram",   tr: "Telegram",   zh: "Telegram" },
  "mode.music":    { uk: "Музика",      en: "Music",    ru: "Музыка",     de: "Musik",      tr: "Müzik",      zh: "音乐" },
  "mode.text":     { uk: "Текст",       en: "Text",     ru: "Текст",      de: "Text",       tr: "Metin",      zh: "文本" },

  // ── NEXUS page ──────────────────────────────────────────────────────
  "page.nexus.module":     { uk: "МОДУЛЬ 08 · МУЛЬТИ-МОДЕЛЬНИЙ КОНСЕНСУС", en: "MODULE 08 · MULTI-MODEL CONSENSUS ENGINE", ru: "МОДУЛЬ 08 · МУЛЬТИ-МОДЕЛЬНЫЙ КОНСЕНСУС", de: "MODUL 08 · MULTI-MODELL KONSENS", tr: "MODÜL 08 · ÇOKLU MODEL KONSENSÜS", zh: "模块 08 · 多模型共识引擎" },
  "page.nexus.avail":      { uk: "моделей доступно",  en: "models available",    ru: "моделей доступно",  de: "Modelle verfügbar",   tr: "model mevcut",        zh: "个模型可用" },
  "page.nexus.parallel":   { uk: "4 AI паралельно → консенсус",   en: "4 AI parallel → consensus",     ru: "4 AI параллельно → консенсус",   de: "4 AI parallel → Konsens", tr: "4 AI paralel → konsensüs", zh: "4 AI 并行 → 共识" },
  "page.nexus.solo_mode":  { uk: "solo режим — обрана модель",    en: "solo mode — selected model",    ru: "solo режим — выбранная модель",  de: "Solo-Modus — gewähltes Modell", tr: "solo mod — seçili model", zh: "单一模式 — 选定模型" },
  "page.nexus.model_sel":  { uk: "ВИБІР AI МОДЕЛІ",  en: "AI MODEL SELECT",    ru: "ВЫБОР AI МОДЕЛИ",  de: "KI-MODELL WÄHLEN",    tr: "AI MODEL SEÇİMİ",     zh: "AI 模型选择" },
  "page.nexus.available":  { uk: "ДОСТУПНИХ",         en: "AVAILABLE",          ru: "ДОСТУПНО",         de: "VERFÜGBAR",           tr: "MEVCUT",              zh: "可用" },
  "page.nexus.from_weak":  { uk: "від слабкіших до найпотужніших", en: "from weakest to most powerful", ru: "от слабых к самым мощным", de: "von schwächsten zu stärksten", tr: "en zayıftan en güçlüye", zh: "从最弱到最强" },
  "page.nexus.pick_model": { uk: "Оберіть модель",   en: "Select a model",     ru: "Выберите модель",  de: "Modell wählen",       tr: "Model seçin",         zh: "选择模型" },
  "page.nexus.key_exp":    { uk: "GEMINI API KEY ПРОСТРОЧЕНИЙ",  en: "GEMINI API KEY EXPIRED",       ru: "GEMINI API KEY ПРОСРОЧЕН",  de: "GEMINI API KEY ABGELAUFEN", tr: "GEMINI API KEY SÜRESİ DOLDU", zh: "GEMINI API KEY 已过期" },
  "page.nexus.key_exp_d":  { uk: "Ключ прострочений — Google відхиляє всі запити. NEXUS Orchestra та HEAL цикл не працюють.", en: "Key expired — Google rejects all requests. NEXUS Orchestra and HEAL cycle are not working.", ru: "Ключ просрочен — Google отклоняет все запросы.", de: "Schlüssel abgelaufen — Google lehnt alle Anfragen ab.", tr: "Anahtar süresi doldu — Google tüm istekleri reddediyor.", zh: "密钥已过期 — Google 拒绝所有请求。NEXUS Orchestra 和 HEAL 循环无法工作。" },
  "page.nexus.get_key":    { uk: "Отримати новий ключ",  en: "Get new key",       ru: "Получить новый ключ",  de: "Neuen Schlüssel holen",  tr: "Yeni anahtar al",    zh: "获取新密钥" },
  "page.nexus.all_err":    { uk: "Усі моделі повернули помилку. Перевір ключі в Settings.", en: "All models returned an error. Check keys in Settings.", ru: "Все модели вернули ошибку. Проверь ключи в Settings.", de: "Alle Modelle gaben einen Fehler zurück. Überprüfe die Schlüssel.", tr: "Tüm modeller hata döndürdü. Ayarlardaki anahtarları kontrol et.", zh: "所有模型返回错误。请在 Settings 中检查密钥。" },
  "page.nexus.quick_send": { uk: "W/Ctrl + Enter – швидка відправка", en: "W/Ctrl + Enter – quick send", ru: "W/Ctrl + Enter – быстрая отправка", de: "W/Strg + Enter – schnell senden", tr: "W/Ctrl + Enter – hızlı gönder", zh: "W/Ctrl + Enter – 快速发送" },
  "page.nexus.placeholder":{ uk: "Що хочеш створити або запитати...", en: "What do you want to create or ask...", ru: "Что ты хочешь создать или спросить...", de: "Was möchtest du erstellen oder fragen...", tr: "Ne oluşturmak veya sormak istiyorsun...", zh: "你想创建或询问什么..." },
  "page.nexus.judge":      { uk: "суддя",              en: "judge",              ru: "судья",            de: "Richter",             tr: "hakim",               zh: "裁判" },
  "page.nexus.agreement":  { uk: "УЗГОДЖЕНІСТЬ",       en: "AGREEMENT",          ru: "СОГЛАШЕНИЕ",       de: "ÜBEREINSTIMMUNG",     tr: "ANLAŞMA",             zh: "一致性" },
  "page.nexus.models_lbl": { uk: "МОДЕЛІ",             en: "MODELS",             ru: "МОДЕЛИ",           de: "MODELLE",             tr: "MODELLER",            zh: "模型" },
  "page.nexus.orchestra":  { uk: "ОРКЕСТР",            en: "ORCHESTRA",          ru: "ОРКЕСТР",          de: "ORCHESTER",           tr: "ORKESTRA",            zh: "管弦乐" },

  // ── Threats page ────────────────────────────────────────────────────
  "page.threats.title":    { uk: "THREATS MATRIX",     en: "THREATS MATRIX",     ru: "THREATS MATRIX",   de: "BEDROHUNGSMATRIX",    tr: "TEHDİT MATRİSİ",      zh: "威胁矩阵" },
  "page.threats.tvl_risk": { uk: "TVL під загрозою активних вразливостей", en: "TVL at risk from active vulnerabilities", ru: "TVL под угрозой активных уязвимостей", de: "TVL durch aktive Schwachstellen gefährdet", tr: "Aktif açıklardan kaynaklanan TVL riski", zh: "活跃漏洞导致的 TVL 风险" },
  "page.threats.scanning": { uk: "Сканую загрози...",  en: "Scanning threats...", ru: "Сканирую угрозы...",de: "Scanne Bedrohungen...",tr: "Tehditler taranıyor...",zh: "扫描威胁中..." },
  "page.threats.none":     { uk: "Загроз не знайдено", en: "No threats found",    ru: "Угроз не найдено", de: "Keine Bedrohungen",   tr: "Tehdit bulunamadı",   zh: "未发现威胁" },
  "page.threats.heal_plan":{ uk: "ПЛАН УСУНЕННЯ",      en: "HEALING PLAN",        ru: "ПЛАН УСТРАНЕНИЯ",  de: "HEILUNGSPLAN",        tr: "İYİLEŞTİRME PLANI",   zh: "修复计划" },

  // ── Immune page ─────────────────────────────────────────────────────
  "page.immune.title":     { uk: "IMMUNE SYSTEM",      en: "IMMUNE SYSTEM",       ru: "IMMUNE SYSTEM",    de: "IMMUNSYSTEM",         tr: "BAĞIŞIKLIK SİSTEMİ",  zh: "免疫系统" },
  "page.immune.subtitle":  { uk: "Захисні механізми активні — TITAN-94 самовідновлюється в реальному часі", en: "Protective mechanisms active — TITAN-94 self-heals in real time", ru: "Защитные механизмы активны — TITAN-94 самовосстанавливается", de: "Schutzmechanismen aktiv — TITAN-94 heilt sich in Echtzeit", tr: "Koruma mekanizmaları aktif — TITAN-94 gerçek zamanlı iyileşiyor", zh: "保护机制激活 — TITAN-94 实时自我修复" },
  "page.immune.how_works": { uk: "Як працює Імунна система? (інструкція)", en: "How does the Immune System work? (guide)", ru: "Как работает Иммунная система? (инструкция)", de: "Wie funktioniert das Immunsystem? (Anleitung)", tr: "Bağışıklık sistemi nasıl çalışır? (kılavuz)", zh: "免疫系统如何工作？（指南）" },
  "page.immune.warning":   { uk: "«виліковування» = оновлення knowledge base, а НЕ безпосередня зміна смарт-контрактів. Реальне виправлення потребує дій від команди протоколу.", en: "'healing' = updating the knowledge base, NOT directly modifying smart contracts. Real fixes require action from the protocol team.", ru: "«лечение» = обновление knowledge base, а НЕ изменение смарт-контрактов напрямую.", de: "«Heilen» = Aktualisierung der Wissensdatenbank, KEINE direkte Änderung von Smart Contracts.", tr: "«iyileştirme» = knowledge base güncelleme, akıllı sözleşmeleri doğrudan DEĞİŞTİRMEZ.", zh: "「修复」= 更新知识库，而非直接修改智能合约。实际修复需要协议团队的操作。" },
  "page.immune.what_does": { uk: "Що робить:",         en: "What it does:",       ru: "Что делает:",      de: "Was es macht:",       tr: "Ne yapar:",            zh: "功能：" },
  "page.immune.what_fixes":{ uk: "Що виправляє:",      en: "What it fixes:",      ru: "Что исправляет:",  de: "Was es behebt:",      tr: "Ne düzeltir:",         zh: "修复内容：" },
  "page.immune.blacklist": { uk: "ЧОРНИЙ СПИСОК",      en: "BLACKLIST",           ru: "ЧЁРНЫЙ СПИСОК",    de: "SCHWARZLISTE",        tr: "KARA LİSTE",          zh: "黑名单" },
  "page.immune.shields":   { uk: "ЩИТИ СИСТЕМИ",       en: "SYSTEM SHIELDS",      ru: "ЩИТЫ СИСТЕМЫ",     de: "SYSTEMSCHILDE",       tr: "SİSTEM KALKANİ",      zh: "系统防护" },
  "page.immune.no_threats":{ uk: "Активних загроз немає", en: "No active threats", ru: "Активных угроз нет", de: "Keine aktiven Bedrohungen", tr: "Aktif tehdit yok", zh: "暂无活跃威胁" },
  "page.immune.scan_step": { uk: "SCAN (кожні 3 хв) → виявляє вразливість", en: "SCAN (every 3 min) → detects vulnerability", ru: "SCAN (каждые 3 мин) → обнаруживает уязвимость", de: "SCAN (alle 3 Min) → erkennt Schwachstelle", tr: "SCAN (her 3 dk) → açık tespit eder", zh: "SCAN（每3分钟）→ 检测漏洞" },
  "page.immune.ai_step":   { uk: "AI аналіз → оцінює небезпеку", en: "AI analysis → assesses risk", ru: "AI анализ → оценивает опасность", de: "KI-Analyse → bewertet Gefahr", tr: "AI analizi → riski değerlendirir", zh: "AI 分析 → 评估风险" },
  "page.immune.heal_step": { uk: "HEAL (кожні 5 хв) → виправляє", en: "HEAL (every 5 min) → fixes", ru: "HEAL (каждые 5 мин) → исправляет", de: "HEAL (alle 5 Min) → behebt", tr: "HEAL (her 5 dk) → düzeltir", zh: "HEAL（每5分钟）→ 修复" },
  "page.immune.learn_step":{ uk: "LEARN (кожні 7 хв) → навчається", en: "LEARN (every 7 min) → learns", ru: "LEARN (каждые 7 мин) → обучается", de: "LEARN (alle 7 Min) → lernt", tr: "LEARN (her 7 dk) → öğrenir", zh: "LEARN（每7分钟）→ 学习" },

  // ── Status page ─────────────────────────────────────────────────────
  "page.status.title":     { uk: "AGENT STATUS",       en: "AGENT STATUS",        ru: "AGENT STATUS",     de: "AGENTENSTATUS",       tr: "AJAN DURUMU",         zh: "代理状态" },
  "page.status.subtitle":  { uk: "Реальний час роботи чотирьох автономних циклів TITAN-94", en: "Real-time operation of four autonomous TITAN-94 cycles", ru: "Реальное время работы четырёх автономных циклов TITAN-94", de: "Echtzeitbetrieb der vier autonomen TITAN-94-Zyklen", tr: "Dört otonom TITAN-94 döngüsünün gerçek zamanlı çalışması", zh: "四个自主 TITAN-94 循环的实时运行状态" },
  "page.status.scan_name": { uk: "СКАНУВАННЯ БЛОКЧЕЙНУ", en: "BLOCKCHAIN SCAN",    ru: "СКАНИРОВАНИЕ БЛОКЧЕЙНА", de: "BLOCKCHAIN-SCAN",  tr: "BLOK ZİNCİRİ TARAMA", zh: "区块链扫描" },
  "page.status.heal_name": { uk: "САМО-ВІДНОВЛЕННЯ",    en: "SELF-HEALING",        ru: "САМО-ВОССТАНОВЛЕНИЕ",de: "SELBSTHEILUNG",      tr: "KENDİ KENDİNE İYİLEŞME", zh: "自我修复" },
  "page.status.learn_name":{ uk: "НАВЧАННЯ AI",         en: "AI LEARNING",         ru: "ОБУЧЕНИЕ AI",      de: "KI-LERNEN",           tr: "AI ÖĞRENMESİ",        zh: "AI 学习" },
  "page.status.fin_name":  { uk: "ФІНАНСОВИЙ МОНІТОРИНГ",en: "FINANCE MONITORING",ru: "ФИНАНСОВЫЙ МОНИТОРИНГ",de: "FINANZÜBERWACHUNG", tr: "FİNANSAL İZLEME",    zh: "财务监控" },

  // ── Evolution page ──────────────────────────────────────────────────
  "page.evolution.title":  { uk: "EVOLUTION ENGINE",   en: "EVOLUTION ENGINE",    ru: "EVOLUTION ENGINE", de: "EVOLUTIONS-ENGINE",   tr: "EVRİM MOTORU",        zh: "进化引擎" },
  "page.evolution.sub":    { uk: "Автономний розвиток — організм мутує і росте", en: "Autonomous development — organism mutates and grows", ru: "Автономное развитие — организм мутирует и растёт", de: "Autonome Entwicklung — Organismus mutiert und wächst", tr: "Otonom gelişim — organizma mutasyona uğruyor ve büyüyor", zh: "自主发展 — 生命体变异并成长" },
  "page.evolution.evolv":  { uk: "ЕВОЛЮЦІЯ",           en: "EVOLVING",            ru: "ЭВОЛЮЦИЯ",         de: "EVOLUTION",           tr: "EVRİM",               zh: "进化中" },
  "page.evolution.know":   { uk: "НЕЙРОННА БАЗА ЗНАНЬ", en: "NEURAL KNOWLEDGE BASE", ru: "НЕЙРОННАЯ БАЗА ЗНАНИЙ", de: "NEURALE WISSENSDATENBANK", tr: "SİNİRSEL BİLGİ TABANI", zh: "神经知识库" },
  "page.evolution.pats":   { uk: "ПАТЕРНІВ",           en: "PATTERNS",            ru: "ПАТТЕРНОВ",        de: "MUSTER",              tr: "KALIPLAR",            zh: "个模式" },
  "page.evolution.conf":   { uk: "сер. впевненість",   en: "avg confidence",      ru: "средняя уверенность", de: "Ø-Konfidenz",      tr: "ort. güven",          zh: "平均置信度" },

  // ── Analytics page ──────────────────────────────────────────────────
  "page.analytics.title":  { uk: "ANALYTICS",          en: "ANALYTICS",           ru: "АНАЛИТИКА",        de: "ANALYTIK",            tr: "ANALİTİK",            zh: "数据分析" },
  "page.analytics.sub":    { uk: "CryptoVarta intelligence — 24г активність та ринкові сигнали", en: "CryptoVarta intelligence — 24h activity & market signals", ru: "CryptoVarta — 24ч активность и рыночные сигналы", de: "CryptoVarta — 24h-Aktivität und Marktsignale", tr: "CryptoVarta — 24s aktivite ve piyasa sinyalleri", zh: "CryptoVarta 智能 — 24h 活动与市场信号" },
  "page.analytics.24h":    { uk: "24Г АКТИВНІСТЬ — СКАНИ · ХІЛИ · АНАЛІЗ · ЗАГРОЗИ", en: "24H ACTIVITY — SCANS · HEALS · ANALYSIS · THREATS", ru: "24Ч АКТИВНОСТЬ — СКАНЫ · ХИЛЫ · АНАЛИЗ · УГРОЗЫ", de: "24H-AKTIVITÄT — SCANS · HEALS · ANALYSE · BEDROHUNGEN", tr: "24S AKTİVİTE — TARAMA · İYİLEŞME · ANALİZ · TEHDİT", zh: "24H 活动 — 扫描 · 修复 · 分析 · 威胁" },
  "page.analytics.arb":    { uk: "АРБІТРАЖНІ СИГНАЛИ", en: "ARBITRAGE SIGNALS",   ru: "АРБИТРАЖНЫЕ СИГНАЛЫ", de: "ARBITRAGE-SIGNALE", tr: "ARBİTRAJ SİNYALLERİ", zh: "套利信号" },
  "page.analytics.subs":   { uk: "ПІДПИСКИ",           en: "SUBSCRIPTIONS",       ru: "ПОДПИСКИ",         de: "ABONNEMENTS",         tr: "ABONELİKLER",         zh: "订阅" },

  // ── Earn page ───────────────────────────────────────────────────────
  "page.earn.title":       { uk: "ЗАРОБІТОК",          en: "EARNINGS",            ru: "ЗАРАБОТОК",        de: "EINNAHMEN",           tr: "KAZANÇLAR",           zh: "收益" },
  "page.earn.sub":         { uk: "Автоматичні нарахування PRO/ELITE · Реферали · Виведення TON", en: "Auto-accruals PRO/ELITE · Referrals · TON Withdrawal", ru: "Авто-начисления PRO/ELITE · Рефералы · Вывод TON", de: "Auto-Gutschriften PRO/ELITE · Empfehlungen · TON-Auszahlung", tr: "PRO/ELITE otomatik tahakkuk · Referanslar · TON çekimi", zh: "PRO/ELITE 自动积分 · 推荐 · TON 提现" },
  "page.earn.your_bal":    { uk: "ВАШ БАЛАНС",         en: "YOUR BALANCE",        ru: "ВАШ БАЛАНС",       de: "IHR GUTHABEN",        tr: "BAKİYENİZ",           zh: "您的余额" },
  "page.earn.withdraw":    { uk: "Вивести",             en: "Withdraw",            ru: "Вывести",          de: "Auszahlen",           tr: "Çek",                 zh: "提现" },
  "page.earn.ref_prog":    { uk: "РЕФЕРАЛЬНА ПРОГРАМА", en: "REFERRAL PROGRAM",   ru: "РЕФЕРАЛЬНАЯ ПРОГРАММА", de: "EMPFEHLUNGSPROGRAMM", tr: "REFERANS PROGRAMI",  zh: "推荐计划" },
  "page.earn.copy_link":   { uk: "Скопіювати посилання", en: "Copy link",         ru: "Скопировать ссылку", de: "Link kopieren",      tr: "Bağlantıyı kopyala",  zh: "复制链接" },
  "page.earn.subscribe":   { uk: "ПІДПИСКА",            en: "SUBSCRIPTION",       ru: "ПОДПИСКА",         de: "ABONNEMENT",          tr: "ABONELİK",            zh: "订阅" },
  "page.earn.auto_earn":   { uk: "АВТО-ЗАРОБІТОК",      en: "AUTO-EARN",          ru: "АВТО-ЗАРАБОТОК",   de: "AUTO-VERDIENST",      tr: "OTOMATİK KAZANÇ",     zh: "自动收益" },
  "page.earn.withdraw_to": { uk: "Адреса виводу TON",   en: "TON withdrawal address", ru: "Адрес вывода TON", de: "TON Auszahlungsadresse", tr: "TON çekim adresi",  zh: "TON 提现地址" },
  "page.earn.min_withdraw":{ uk: "Мінімум виводу: 0.5 TON", en: "Minimum withdrawal: 0.5 TON", ru: "Минимум вывода: 0.5 TON", de: "Mindestabhebung: 0.5 TON", tr: "Minimum çekim: 0.5 TON", zh: "最低提现：0.5 TON" },
  "page.earn.copied":      { uk: "✅ Скопійовано!",      en: "✅ Copied!",          ru: "✅ Скопировано!",  de: "✅ Kopiert!",          tr: "✅ Kopyalandı!",       zh: "✅ 已复制！" },
  "page.earn.ref_copy":    { uk: "Реферальне посилання в буфері обміну", en: "Referral link copied to clipboard", ru: "Реферальная ссылка скопирована", de: "Empfehlungslink kopiert", tr: "Referans bağlantısı kopyalandı", zh: "推荐链接已复制到剪贴板" },

  // ── Command Center page ─────────────────────────────────────────────
  "page.command.title":    { uk: "PROTOCOL 94 · NEURAL CORE", en: "PROTOCOL 94 · NEURAL CORE", ru: "PROTOCOL 94 · NEURAL CORE", de: "PROTOCOL 94 · NEURAL CORE", tr: "PROTOCOL 94 · NEURAL CORE", zh: "PROTOCOL 94 · 神经核心" },
  "page.command.tagline":  { uk: "Суверенний AI-страж TON блокчейну — самосканує, саморемонтується, самонавчається", en: "Sovereign AI guardian of TON blockchain — self-scans, self-heals, self-learns", ru: "Суверенный AI-страж TON — самосканирует, самовосстанавливается, самообучается", de: "Souveräner KI-Wächter von TON — selbst-scannt, heilt, lernt", tr: "TON blok zincirinin egemen AI koruyucusu — kendini tarar, onarır, öğrenir", zh: "TON 区块链的主权 AI 守护者 — 自扫描、自修复、自学习" },
  "page.command.cycle_info":{ uk: "Автономні цикли TITAN-94 постійно захищають блокчейн TON 24/7", en: "TITAN-94 autonomous cycles continuously protect TON blockchain 24/7", ru: "Автономные циклы TITAN-94 постоянно защищают блокчейн TON 24/7", de: "Autonome TITAN-94-Zyklen schützen TON-Blockchain 24/7", tr: "TITAN-94 otonom döngüleri TON blok zincirini 7/24 sürekli korur", zh: "TITAN-94 自主循环 24/7 持续保护 TON 区块链" },

  // ── Creator page ─────────────────────────────────────────────────────
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
  "creator.tab.broadcast":    { uk: "Розсилка",      en: "Broadcast",      ru: "Рассылка" },
  "creator.tab.diagnostics":  { uk: "Діагностика",   en: "Diagnostics",    ru: "Диагностика" },
  "creator.kpi.users":    { uk: "ВСЬОГО ЮЗЕРІВ", en: "TOTAL USERS",    ru: "ВСЕГО ЮЗЕРОВ" },
  "creator.kpi.revenue":  { uk: "МІСЯЧНИЙ ДОХІД",en: "MONTHLY REVENUE",ru: "МЕС. ДОХОД" },
  "creator.kpi.vulns":    { uk: "ВРАЗЛИВОСТІ",   en: "VULNERABILITIES",ru: "УЯЗВИМОСТИ" },
  "creator.kpi.accuracy": { uk: "ТОЧНІСТЬ АГЕНТА",en: "AGENT ACCURACY",ru: "ТОЧНОСТЬ АГЕНТА" },
  "creator.menu.title":   { uk: "ВИДИМІСТЬ ПУНКТІВ МЕНЮ", en: "MENU ITEM VISIBILITY", ru: "ВИДИМОСТЬ ПУНКТОВ МЕНЮ" },
  "creator.menu.hint":    { uk: "Знімай галочку — пункт зникне для всіх. Зміни застосовуються одразу.", en: "Uncheck to hide an item for all users. Changes apply immediately.", ru: "Снимай галочку — пункт исчезнет для всех. Изменения применяются сразу." },
  "creator.menu.save":    { uk: "Зберегти меню", en: "Save menu",      ru: "Сохранить меню" },
  "creator.menu.all_on":  { uk: "Увімкнути всі", en: "Enable all",     ru: "Включить все" },
  "creator.menu.all_off": { uk: "Вимкнути всі",  en: "Disable all",    ru: "Выключить все" },
  "creator.access_denied":{ uk: "Доступ заборонено. Цей розділ тільки для творця TITAN-94.", en: "Access denied. This section is for the TITAN-94 creator only.", ru: "Доступ запрещён. Только для создателя TITAN-94." },
  "creator.redirecting":  { uk: "Перенаправлення на головну...", en: "Redirecting to home...", ru: "Перенаправление на главную..." },
};

export function t(key: string, lang: Lang): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry["en"] ?? entry["uk"] ?? key;
}
