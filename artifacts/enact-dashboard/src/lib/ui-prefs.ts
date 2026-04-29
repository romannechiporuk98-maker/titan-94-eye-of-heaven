/**
 * UI Preferences — theme (dark/light) and language (uk/en/ru).
 *
 * Persisted in localStorage. Theme is also pushed to <html data-theme>
 * so CSS can override variables. Language is exposed via the `t()`
 * helper for translatable UI strings.
 */
import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";
export type Lang  = "uk" | "en" | "ru";
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
  if (v === "en" || v === "ru" || v === "uk") return v;
  // Auto-detect from browser
  const nav = navigator.language?.toLowerCase() || "";
  if (nav.startsWith("ru")) return "ru";
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

/** Return the resolved IANA timezone (auto → browser default). */
export function resolveTz(tz: Tz): string {
  if (tz !== "auto") return tz;
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
  catch { return "UTC"; }
}

/** Format a date in the user's chosen timezone. */
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

/** Short HH:mm in chosen tz, used in compact UI badges. */
export function fmtClock(input: Date | string | number, tz: Tz): string {
  return fmtTime(input, tz, { year: undefined, month: undefined, day: undefined, second: undefined });
}

// ── Translation dictionary ─────────────────────────────────
type Dict = Record<string, Record<Lang, string>>;

const DICT: Dict = {
  "nav.command":   { uk: "Командний центр",  en: "Command Center", ru: "Командный центр" },
  "nav.threats":   { uk: "Загрози",          en: "Threats",        ru: "Угрозы" },
  "nav.contracts": { uk: "Смартконтракти",   en: "Smart Contracts",ru: "Смартконтракты" },
  "nav.analyze":   { uk: "Нейрохаб",         en: "Neural Hub",     ru: "Нейрохаб" },
  "nav.evolution": { uk: "Еволюція",         en: "Evolution",      ru: "Эволюция" },
  "nav.immune":    { uk: "Імунна система",   en: "Immune System",  ru: "Иммунная система" },
  "nav.analytics": { uk: "Аналітика",        en: "Analytics",      ru: "Аналитика" },
  "nav.status":    { uk: "Статус агента",    en: "Agent Status",   ru: "Статус агента" },
  "nav.earn":      { uk: "Заробіток",        en: "Earnings",       ru: "Заработок" },
  "nav.autotrade": { uk: "Авто-трейд",       en: "Auto-Trade",     ru: "Авто-трейд" },
  "nav.builder":   { uk: "Кузня агентів",    en: "Agent Forge",    ru: "Кузня агентов" },
  "nav.developer": { uk: "Режим розробника", en: "Developer Mode", ru: "Режим разработчика" },
  "nav.nexus":     { uk: "NEXUS AI",         en: "NEXUS AI",       ru: "NEXUS AI" },
  "nav.settings":  { uk: "API сейф",         en: "API Vault",      ru: "API сейф" },
  "nav.vault":     { uk: "Мобільний сейф",   en: "Mobile Vault",   ru: "Мобильный сейф" },
  "nav.access":    { uk: "Тарифи доступу",   en: "Access Tiers",   ru: "Тарифы доступа" },
  "nav.enact":     { uk: "ENACT огляд",      en: "ENACT Overview", ru: "ENACT обзор" },
  "nav.jobs":      { uk: "Робочі завдання",  en: "Job Explorer",   ru: "Задания" },
  "nav.create":    { uk: "Створити завдання",en: "Create Job",     ru: "Создать задание" },

  "group.titan":   { uk: "TITAN-94",         en: "TITAN-94",       ru: "TITAN-94" },
  "group.agent":   { uk: "АГЕНТ",            en: "AGENT",          ru: "АГЕНТ" },
  "group.enact":   { uk: "ENACT",            en: "ENACT",          ru: "ENACT" },

  "tag.live":      { uk: "ОНЛАЙН",           en: "LIVE",           ru: "ОНЛАЙН" },
  "tag.organism":  { uk: "ОРГАНІЗМ ОНЛАЙН",  en: "ORGANISM ONLINE",ru: "ОРГАНИЗМ ОНЛАЙН" },
  "tag.contracts": { uk: "КОНТРАКТИ",        en: "CONTRACTS",      ru: "КОНТРАКТЫ" },
  "tag.security":  { uk: "ЯДРО БЕЗПЕКИ",     en: "SECURITY CORE",  ru: "ЯДРО БЕЗОПАСНОСТИ" },

  "btn.theme":     { uk: "Тема",             en: "Theme",          ru: "Тема" },
  "btn.lang":      { uk: "Мова",             en: "Language",       ru: "Язык" },
  "btn.tz":        { uk: "Часовий пояс",     en: "Timezone",       ru: "Часовой пояс" },
  "btn.menu_open": { uk: "Відкрити меню",    en: "Open menu",      ru: "Открыть меню" },
  "btn.menu_close":{ uk: "Закрити меню",     en: "Close menu",     ru: "Закрыть меню" },
};

export function t(key: string, lang: Lang): string {
  return DICT[key]?.[lang] ?? key;
}
