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

const THEME_KEY = "titan94.theme";
const LANG_KEY  = "titan94.lang";

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
  "btn.menu_open": { uk: "Відкрити меню",    en: "Open menu",      ru: "Открыть меню" },
  "btn.menu_close":{ uk: "Закрити меню",     en: "Close menu",     ru: "Закрыть меню" },
};

export function t(key: string, lang: Lang): string {
  return DICT[key]?.[lang] ?? key;
}
