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
import { logger } from "../lib/logger";

const STORE = path.resolve(process.cwd(), ".titan-secrets.json");

export const SECRET_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TON_API_KEY",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "TONAPI_KEY",
] as const;

export type SecretKey = typeof SECRET_KEYS[number];

const META: Record<SecretKey, { name: string; description: string; provider: string; getUrl: string; required: boolean; }> = {
  TELEGRAM_BOT_TOKEN: { name: "Telegram Bot Token", description: "Бот /start /menu /forge /scan, push-алерти, broadcast підписникам", provider: "@BotFather (Telegram)",       getUrl: "https://t.me/BotFather",                              required: true  },
  TON_API_KEY:        { name: "TonCenter API Key",  description: "Підняти ліміт сканування блоків TON з 1→10 req/sec",            provider: "@tonapibot (Telegram)",      getUrl: "https://t.me/tonapibot",                              required: false },
  GEMINI_API_KEY:     { name: "Google Gemini",      description: "Базова AI-модель: vuln-аналіз, NEXUS, AI Engineer",            provider: "Google AI Studio",           getUrl: "https://aistudio.google.com/app/apikey",              required: false },
  OPENAI_API_KEY:     { name: "OpenAI GPT-4o",      description: "Друга AI-модель в Orchestra, для крос-валідації",              provider: "OpenAI Platform",            getUrl: "https://platform.openai.com/api-keys",                required: false },
  ANTHROPIC_API_KEY:  { name: "Anthropic Claude",   description: "Третя AI-модель — судія в консенсусі",                          provider: "Anthropic Console",          getUrl: "https://console.anthropic.com/settings/keys",         required: false },
  OPENROUTER_API_KEY: { name: "OpenRouter",         description: "Доступ до 100+ моделей через одну API",                         provider: "OpenRouter",                 getUrl: "https://openrouter.ai/keys",                          required: false },
  TONAPI_KEY:         { name: "TonAPI Pro",         description: "Деталі по Jetton/NFT, історія гаманців",                       provider: "TonConsole",                 getUrl: "https://tonconsole.com",                              required: false },
};

let cache: Partial<Record<SecretKey, string>> | null = null;

async function load(): Promise<Partial<Record<SecretKey, string>>> {
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
