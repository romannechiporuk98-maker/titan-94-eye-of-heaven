/**
 * TITAN-94 Creator Mode
 *
 * Hidden, hardcoded creator authorization. Only specific Telegram IDs are recognized
 * as creators (full god-mode access).  Settings persist to disk so they survive restarts.
 *
 * Add more creator IDs by editing CREATOR_IDS below or via env CREATOR_TG_IDS="id1,id2".
 */
import { promises as fs } from "fs";
import path from "path";
import { logger } from "../lib/logger";

// ─── Hardcoded creator identity (Roman) ──────────────────────────────────
const HARDCODED_CREATORS = ["7255058720"];
const ENV_CREATORS = (process.env["CREATOR_TG_IDS"] || "").split(",").map((s) => s.trim()).filter(Boolean);
const CREATOR_IDS = new Set([...HARDCODED_CREATORS, ...ENV_CREATORS]);

export function isCreator(telegramId?: string | null): boolean {
  if (!telegramId) return false;
  return CREATOR_IDS.has(String(telegramId));
}

export function listCreators(): string[] {
  return [...CREATOR_IDS];
}

// ─── Persisted settings store ────────────────────────────────────────────
const SETTINGS_FILE = path.resolve(process.cwd(), ".titan-creator-settings.json");

export interface CreatorSettings {
  // Subscription pricing (TON)
  proPriceTon: number;
  elitePriceTon: number;
  developerPriceTon: number;
  freeTrialHours: number;

  // Auto-earn rates per cycle (TON)
  elitePerCycle: number;
  proPerCycle: number;
  developerPerCycle: number;
  autoEarnIntervalMin: number;

  // Withdrawal
  minWithdrawalTon: number;
  cpaPct: number; // referral commission %

  // System toggles
  scanCycleEnabled: boolean;
  healCycleEnabled: boolean;
  learnCycleEnabled: boolean;
  autoEarnEnabled: boolean;
  tonPollerEnabled: boolean;
  tgBotEnabled: boolean;

  // Branding / messages
  welcomeMessage: string;
  reserveAddress: string;

  // Developer tier perks
  developerApiQuotaPerDay: number;
  developerCustomEnabled: boolean;

  // Nav visibility — keys are href paths (e.g. "/threats"), false = hidden for all users
  navVisibility: Record<string, boolean>;

  // Audit
  updatedAt: string;
  updatedBy: string;
}

const DEFAULTS: CreatorSettings = {
  proPriceTon: 5,
  elitePriceTon: 20,
  developerPriceTon: 1000,
  freeTrialHours: 72,

  elitePerCycle: 0.0010,
  proPerCycle: 0.0003,
  developerPerCycle: 0.0500,
  autoEarnIntervalMin: 6,

  minWithdrawalTon: 0.5,
  cpaPct: 15,

  scanCycleEnabled: true,
  healCycleEnabled: true,
  learnCycleEnabled: true,
  autoEarnEnabled: true,
  tonPollerEnabled: true,
  tgBotEnabled: true,

  welcomeMessage: "🛡 TITAN-94 · ОКО НЕБЕСНЕ — autonomous AI security agent for TON.",
  reserveAddress: "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v",

  developerApiQuotaPerDay: 10000,
  developerCustomEnabled: true,

  navVisibility: {},

  updatedAt: new Date(0).toISOString(),
  updatedBy: "default",
};

let cache: CreatorSettings | null = null;

async function loadFromDisk(): Promise<CreatorSettings> {
  try {
    const buf = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(buf);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

async function saveToDisk(s: CreatorSettings): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(s, null, 2), "utf-8");
}

export async function getSettings(): Promise<CreatorSettings> {
  if (!cache) cache = await loadFromDisk();
  return cache;
}

export async function getSettingsSync(): Promise<CreatorSettings> {
  return await getSettings();
}

export async function updateSettings(
  patch: Partial<CreatorSettings>,
  updatedBy: string = "creator",
): Promise<CreatorSettings> {
  const current = await getSettings();
  // Strip metadata from incoming patch
  const { updatedAt: _ua, updatedBy: _ub, ...clean } = patch;
  const next: CreatorSettings = {
    ...current,
    ...clean,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  cache = next;
  await saveToDisk(next);
  logger.info({ updatedBy, keys: Object.keys(clean) }, "[CREATOR] settings updated");
  return next;
}

export async function resetSettings(updatedBy = "creator"): Promise<CreatorSettings> {
  cache = { ...DEFAULTS, updatedAt: new Date().toISOString(), updatedBy };
  await saveToDisk(cache);
  return cache;
}

// Eagerly load on import so cache is hot for callers
loadFromDisk().then((s) => { cache = s; }).catch(() => {});
