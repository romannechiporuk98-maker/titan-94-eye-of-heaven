/**
 * TITAN-94 — Telegram Mini App integration.
 * Uses the official Telegram WebApp script loaded via index.html.
 * Falls back to a stable demo user when running outside Telegram (browser preview).
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData?: string;
        initDataUnsafe?: {
          user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
          start_param?: string;
        };
        themeParams?: Record<string, string>;
        colorScheme?: "light" | "dark";
        version?: string;
        platform?: string;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
        };
        MainButton?: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export type TgUser = {
  id: string;
  name: string;
  username?: string;
  isReal: boolean;
  startParam?: string;
};

const DEMO: TgUser = { id: "demo_user", name: "Demo User", isReal: false };

let cached: TgUser | null = null;

export function initTelegram(): TgUser {
  if (cached) return cached;
  const wa = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  if (!wa) { cached = DEMO; return DEMO; }
  try {
    wa.ready();
    wa.expand();
    wa.setHeaderColor?.("#060F1A");
    wa.setBackgroundColor?.("#060F1A");
  } catch {}
  const u = wa.initDataUnsafe?.user;
  if (u && u.id) {
    cached = {
      id: String(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "TG User",
      username: u.username,
      isReal: true,
      startParam: wa.initDataUnsafe?.start_param,
    };
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

export function getTgUser(): TgUser {
  return cached ?? initTelegram();
}

export function haptic(kind: "light" | "medium" | "heavy" | "success" | "error" | "warning" = "light") {
  try {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (!hf) return;
    if (kind === "success" || kind === "error" || kind === "warning") hf.notificationOccurred(kind);
    else hf.impactOccurred(kind);
  } catch {}
}
