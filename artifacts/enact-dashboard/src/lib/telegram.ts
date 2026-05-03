/**
 * TITAN-94 — Telegram Mini App integration (full WebApp 7.0+ surface).
 * Uses official telegram-web-app.js loaded via index.html.
 *
 * Exposes:
 *  - initTelegram() / getTgUser() / haptic()
 *  - getInitData() — HMAC-validated by backend
 *  - useBackButton(handler) — wraps native back button
 *  - useMainButton(text, handler) — bottom action button
 *  - cloudStorage — durable per-user KV (Telegram CloudStorage API)
 *  - shareScore() / openInvoice() / requestContact() / etc.
 *  - applyTheme() — auto-applies Telegram theme colors
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export type TgUser = {
  id: string;
  name: string;
  username?: string;
  isReal: boolean;
  isPremium?: boolean;
  startParam?: string;
  languageCode?: string;
};

const DEMO: TgUser = { id: "demo_user", name: "Demo User", isReal: false };
let cached: TgUser | null = null;

export function getWebApp(): any {
  return typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
}

export function initTelegram(): TgUser {
  if (cached) return cached;

  const wa = getWebApp();

  // ── Dev override: ?_dev_tg=<id> — only respected outside real TMA ──────────
  // In production build, never accept dev override (compiled-out by Vite tree-shaking)
  if (typeof window !== "undefined" && !import.meta.env.PROD) {
    try {
      const params = new URLSearchParams(window.location.search);
      const dev = params.get("_dev_tg");
      // Only use dev override if there is no real Telegram session
      if (dev && !(wa?.initDataUnsafe?.user)) {
        cached = { id: dev, name: dev === "7255058720" ? "Roman (Creator)" : `Dev ${dev}`, isReal: false };
        return cached;
      }
    } catch {}
  }

  if (!wa) { cached = DEMO; return DEMO; }

  try {
    wa.ready();
    wa.expand();
    if (wa.requestFullscreen) wa.requestFullscreen?.(); // TG 8.0+
    wa.setHeaderColor?.("#060F1A");
    wa.setBackgroundColor?.("#060F1A");
    wa.setBottomBarColor?.("#060F1A");
    wa.enableClosingConfirmation?.();
    wa.disableVerticalSwipes?.(); // prevent accidental close
  } catch {}

  const u = wa.initDataUnsafe?.user;
  if (u && u.id) {
    cached = {
      id: String(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "TG User",
      username: u.username,
      isReal: true,
      isPremium: u.is_premium,
      startParam: wa.initDataUnsafe?.start_param,
      languageCode: u.language_code,
    };
  } else if (wa.initData && wa.initData.length > 0) {
    // WebApp exists and has initData but user not parsed yet — treat as real
    // (happens briefly while TG is still initializing)
    cached = { id: "tg_loading", name: "Loading…", isReal: true };
  } else {
    cached = DEMO;
  }
  return cached;
}

// Hardcoded creator IDs (mirror of backend services/creator.ts)
const CREATOR_IDS = new Set(["7255058720"]);
export function isCreator(tgId?: string | null): boolean {
  if (!tgId) return false;
  return CREATOR_IDS.has(String(tgId));
}

export function getTgUser(): TgUser { return cached ?? initTelegram(); }

/** Raw initData string for HMAC-verification on backend. */
export function getInitData(): string {
  return getWebApp()?.initData || "";
}

/** Headers object to send with every API call — backend verifies HMAC. */
export function tgHeaders(): Record<string, string> {
  const u = getTgUser();
  const initData = getInitData();
  const h: Record<string, string> = { "x-telegram-id": u.id };
  if (initData) h["x-tg-init-data"] = initData;
  return h;
}

export function haptic(kind: "light" | "medium" | "heavy" | "success" | "error" | "warning" | "selection" = "light") {
  try {
    const hf = getWebApp()?.HapticFeedback;
    if (!hf) return;
    if (kind === "success" || kind === "error" || kind === "warning") hf.notificationOccurred(kind);
    else if (kind === "selection") hf.selectionChanged();
    else hf.impactOccurred(kind);
  } catch {}
}

// ─── BackButton ──────────────────────────────────────────────────────
export function showBackButton(handler: () => void) {
  const wa = getWebApp(); if (!wa?.BackButton) return () => {};
  wa.BackButton.show();
  wa.BackButton.onClick(handler);
  return () => { try { wa.BackButton.offClick(handler); wa.BackButton.hide(); } catch {} };
}

// ─── MainButton (bottom CTA) ─────────────────────────────────────────
export function showMainButton(text: string, handler: () => void, color = "#00FFFF") {
  const wa = getWebApp(); if (!wa?.MainButton) return () => {};
  try {
    wa.MainButton.setText(text);
    wa.MainButton.setParams?.({ color, text_color: "#000000" });
    wa.MainButton.show();
    wa.MainButton.onClick(handler);
  } catch {}
  return () => { try { wa.MainButton.offClick(handler); wa.MainButton.hide(); } catch {} };
}

// ─── CloudStorage (durable per-user KV) ──────────────────────────────
export const cloudStorage = {
  set: (key: string, value: string): Promise<boolean> => new Promise((resolve) => {
    const cs = getWebApp()?.CloudStorage;
    if (!cs) return resolve(false);
    cs.setItem(key, value, (err: any, ok: boolean) => resolve(!err && !!ok));
  }),
  get: (key: string): Promise<string | null> => new Promise((resolve) => {
    const cs = getWebApp()?.CloudStorage;
    if (!cs) return resolve(null);
    cs.getItem(key, (err: any, val: string) => resolve(err ? null : val || null));
  }),
  delete: (key: string): Promise<boolean> => new Promise((resolve) => {
    const cs = getWebApp()?.CloudStorage;
    if (!cs) return resolve(false);
    cs.removeItem(key, (err: any, ok: boolean) => resolve(!err && !!ok));
  }),
};

// ─── Sharing / opening links / payments ───────────────────────────────
export function openTelegramLink(url: string) {
  try { getWebApp()?.openTelegramLink?.(url) || window.open(url, "_blank"); } catch { window.open(url, "_blank"); }
}
export function openLink(url: string, opts: { try_instant_view?: boolean } = {}) {
  try { getWebApp()?.openLink?.(url, opts) || window.open(url, "_blank"); } catch { window.open(url, "_blank"); }
}
export function shareToStory(mediaUrl: string, opts: { text?: string; widget_link?: { url: string; name?: string } } = {}) {
  try { getWebApp()?.shareToStory?.(mediaUrl, opts); } catch {}
}
export function openInvoice(url: string, callback?: (status: string) => void) {
  try { getWebApp()?.openInvoice?.(url, callback); } catch {}
}

// ─── Theme integration ────────────────────────────────────────────────
export function getTgTheme(): { bg: string; text: string; accent: string; isDark: boolean } {
  const wa = getWebApp();
  const tp = wa?.themeParams || {};
  return {
    bg:     tp.bg_color    || "#060F1A",
    text:   tp.text_color  || "#CFFFFF",
    accent: tp.button_color || "#00FFFF",
    isDark: wa?.colorScheme !== "light",
  };
}
