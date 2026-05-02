/**
 * Secrets manager — local file override on top of process.env.
 *
 * UI lets the creator manage API keys without restarting workers.
 * Updates are persisted to .titan-secrets.json and reloaded on demand.
 *
 * Precedence: local override > process.env (so user-entered values win).
 */
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "../lib/logger";

const STORE = path.resolve(process.cwd(), ".titan-secrets.json");

export const SECRET_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ADMIN_CHAT_ID",
  "TON_API_KEY",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "TONAPI_KEY",
  "BINANCE_API_KEY",
  "BINANCE_API_SECRET",
  "TWITTER_BEARER_TOKEN",
] as const;

export type SecretKey = typeof SECRET_KEYS[number];

const META: Record<SecretKey, { name: string; description: string; provider: string; getUrl: string; required: boolean; group: "ai" | "ton" | "telegram" | "trading" | "social"; }> = {
  TELEGRAM_BOT_TOKEN:       { name: "Telegram Bot Token",   description: "Бот /start /menu /forge /scan, push-алерти, broadcast підписникам",           provider: "@BotFather (Telegram)",  getUrl: "https://t.me/BotFather",                       required: true,  group: "telegram" },
  TELEGRAM_ADMIN_CHAT_ID:   { name: "Admin Chat ID",        description: "ID чату або каналу для сповіщень від TITAN-94 (scan-алерти, звіти, помилки). Дізнатись: @userinfobot",  provider: "@userinfobot (Telegram)",  getUrl: "https://t.me/userinfobot",  required: false, group: "telegram" },
  TON_API_KEY:           { name: "TonCenter API Key",  description: "Підняти ліміт сканування блоків TON з 1→10 req/sec",                provider: "@tonapibot (Telegram)",   getUrl: "https://t.me/tonapibot",                       required: false, group: "ton" },
  TONAPI_KEY:            { name: "TonAPI Pro",         description: "Деталі по Jetton/NFT, історія гаманців",                            provider: "TonConsole",              getUrl: "https://tonconsole.com",                       required: false, group: "ton" },
  GEMINI_API_KEY:        { name: "Google Gemini",      description: "Базова AI-модель: vuln-аналіз, NEXUS, AI Engineer",                provider: "Google AI Studio",        getUrl: "https://aistudio.google.com/app/apikey",        required: false, group: "ai" },
  OPENAI_API_KEY:        { name: "OpenAI GPT-4o",      description: "Друга AI-модель в Orchestra, для крос-валідації",                  provider: "OpenAI Platform",         getUrl: "https://platform.openai.com/api-keys",          required: false, group: "ai" },
  ANTHROPIC_API_KEY:     { name: "Anthropic Claude",   description: "Третя AI-модель — судія в консенсусі",                              provider: "Anthropic Console",       getUrl: "https://console.anthropic.com/settings/keys",   required: false, group: "ai" },
  OPENROUTER_API_KEY:    { name: "OpenRouter",         description: "Доступ до 100+ моделей через одну API",                             provider: "OpenRouter",              getUrl: "https://openrouter.ai/keys",                    required: false, group: "ai" },
  BINANCE_API_KEY:       { name: "Binance API Key",    description: "Спот-трейдинг, ціни, автоматична торгівля BTC/ETH/USDT/TON",       provider: "Binance",                 getUrl: "https://www.binance.com/en/my/settings/api-management", required: false, group: "trading" },
  BINANCE_API_SECRET:    { name: "Binance API Secret", description: "Секретний ключ Binance — для підпису торгових ордерів",            provider: "Binance",                 getUrl: "https://www.binance.com/en/my/settings/api-management", required: false, group: "trading" },
  TWITTER_BEARER_TOKEN:  { name: "Twitter Bearer",     description: "Автоматичний постинг алертів і новин в X (Twitter)",               provider: "X Developer Portal",     getUrl: "https://developer.twitter.com/en/portal/dashboard",     required: false, group: "social" },
};

let cache: Partial<Record<string, string>> | null = null;
const META_KEY_PASS  = "__vault_pass_hash";  // sha256(passphrase + salt)
const META_KEY_SALT  = "__vault_pass_salt";

async function load(): Promise<Partial<Record<string, string>>> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache!;
}

async function persist(): Promise<void> {
  if (!cache) return;
  await fs.writeFile(STORE, JSON.stringify(cache, null, 2), "utf-8");
}

/** Resolve a secret value: local override → process.env → empty string. */
export async function get(key: SecretKey): Promise<string> {
  const overrides = await load();
  if (overrides[key]) return overrides[key]!;
  return process.env[key] || "";
}

/** Sync version using last cache snapshot — call ensureLoaded() once at boot. */
export function getSync(key: SecretKey): string {
  if (cache && cache[key]) return cache[key]!;
  return process.env[key] || "";
}

export async function ensureLoaded(): Promise<void> { await load(); }

export async function set(key: SecretKey, value: string): Promise<void> {
  if (!SECRET_KEYS.includes(key)) throw new Error(`Unknown key: ${key}`);
  if (!cache) await load();
  if (value && value.trim()) {
    cache![key] = value.trim();
  } else {
    delete cache![key];
  }
  process.env[key] = value.trim() || process.env[key];
  await persist();
  logger.info({ key, set: !!value }, "[SECRETS] updated");
}

export async function remove(key: SecretKey): Promise<void> {
  if (!cache) await load();
  delete cache![key];
  await persist();
}

export async function statusAll(): Promise<Array<{
  key: SecretKey;
  configured: boolean;
  source: "override" | "env" | "none";
  hint: string;
  meta: typeof META[SecretKey];
}>> {
  const overrides = await load();
  return SECRET_KEYS.map((k) => {
    const fromOverride = !!overrides[k];
    const fromEnv = !fromOverride && !!process.env[k];
    const value = (overrides[k] || process.env[k] || "");
    const source = fromOverride ? "override" : fromEnv ? "env" : "none";
    const hint = value
      ? `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`
      : "(not set)";
    return { key: k, configured: !!value, source, hint, meta: META[k] };
  });
}

// ─── Auto-detect: guess which secret a pasted value belongs to ──────────
export function detectSecretKey(rawValue: string): { key: SecretKey | null; confidence: "high" | "medium" | "low"; candidates: SecretKey[] } {
  const v = (rawValue || "").trim();
  if (!v) return { key: null, confidence: "low", candidates: [] };

  // High-confidence prefix matches
  if (/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(v))     return { key: "TELEGRAM_BOT_TOKEN", confidence: "high", candidates: ["TELEGRAM_BOT_TOKEN"] };
  if (/^sk-ant-api\d+-/.test(v))                    return { key: "ANTHROPIC_API_KEY",  confidence: "high", candidates: ["ANTHROPIC_API_KEY"] };
  if (/^sk-or-v1-/.test(v))                         return { key: "OPENROUTER_API_KEY", confidence: "high", candidates: ["OPENROUTER_API_KEY"] };
  if (/^sk-(proj-)?[A-Za-z0-9_-]{20,}/.test(v))     return { key: "OPENAI_API_KEY",     confidence: "high", candidates: ["OPENAI_API_KEY"] };
  if (/^AIza[0-9A-Za-z_-]{35}$/.test(v))            return { key: "GEMINI_API_KEY",     confidence: "high", candidates: ["GEMINI_API_KEY"] };
  if (/^AAAAA[A-Za-z0-9%_-]{50,}$/.test(v))         return { key: "TWITTER_BEARER_TOKEN", confidence: "high", candidates: ["TWITTER_BEARER_TOKEN"] };

  // 64-char hex → TON or Binance (ambiguous)
  if (/^[a-f0-9]{64}$/.test(v)) {
    return { key: "TON_API_KEY", confidence: "medium", candidates: ["TON_API_KEY", "TONAPI_KEY"] };
  }
  // 64-char alphanumeric → most likely Binance
  if (/^[A-Za-z0-9]{64}$/.test(v)) {
    return { key: "BINANCE_API_KEY", confidence: "medium", candidates: ["BINANCE_API_KEY", "BINANCE_API_SECRET"] };
  }
  // TonAPI keys are typically jwt-like
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) {
    return { key: "TONAPI_KEY", confidence: "high", candidates: ["TONAPI_KEY"] };
  }

  return { key: null, confidence: "low", candidates: [] };
}

// ─── Vault passphrase (for mobile / no-TG access) ────────────────────────
function hashPass(pass: string, salt: string): string {
  return crypto.createHash("sha256").update(pass + ":" + salt).digest("hex");
}

export async function hasPassphrase(): Promise<boolean> {
  const c = await load();
  return !!c[META_KEY_PASS];
}

export async function setPassphrase(pass: string): Promise<void> {
  if (!pass || pass.length < 6) throw new Error("Passphrase must be at least 6 chars");
  if (!cache) await load();
  const salt = crypto.randomBytes(16).toString("hex");
  cache![META_KEY_SALT] = salt;
  cache![META_KEY_PASS] = hashPass(pass, salt);
  await persist();
  logger.info("[SECRETS] vault passphrase set");
}

export async function verifyPassphrase(pass: string): Promise<boolean> {
  const c = await load();
  if (!c[META_KEY_PASS] || !c[META_KEY_SALT]) return false;
  return hashPass(pass || "", c[META_KEY_SALT]!) === c[META_KEY_PASS];
}
