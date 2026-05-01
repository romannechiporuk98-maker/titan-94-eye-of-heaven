/**
 * MIRROR / PROTOCOL-94 — hidden creator-only convergence layer.
 *
 * Reflects the entire organism back to its creator: every subsystem,
 * every counter, every secret-presence flag (never the value itself),
 * every file integrity hash for tamper detection.
 *
 * Commands:
 *  - pulse   → force an immediate heartbeat tick across all cycles
 *  - heal    → reset every module's failure counters & lift quarantines
 *  - integrity → SHA-256 hashes of every critical file
 *  - kill-switch → stops accepting new public traffic (creator-only emergency)
 */
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "../lib/logger";
import * as sentinel from "./sentinel";
import * as eye from "./eye";
import * as secrets from "./secrets";
import * as store from "./store";

const PROJECT_ROOT = process.cwd().replace(/\/artifacts\/api-server$/, "");

const CRITICAL_FILES = [
  "artifacts/api-server/src/index.ts",
  "artifacts/api-server/src/app.ts",
  "artifacts/api-server/src/services/sentinel.ts",
  "artifacts/api-server/src/services/mirror.ts",
  "artifacts/api-server/src/services/eye.ts",
  "artifacts/api-server/src/services/heartbeat.ts",
  "artifacts/api-server/src/services/secrets.ts",
  "artifacts/api-server/src/services/telegram-bot.ts",
  "artifacts/api-server/src/services/ton-scanner.ts",
];

let killSwitchActive = false;

export function isKillSwitched(): boolean { return killSwitchActive; }

export function setKillSwitch(on: boolean): void {
  killSwitchActive = on;
  logger.warn({ on }, "[MIRROR] kill-switch state changed");
}

async function fileHash(rel: string): Promise<{ path: string; sha256: string | null; bytes: number | null; mtime: string | null }> {
  try {
    const abs = path.resolve(PROJECT_ROOT, rel);
    const buf = await fs.readFile(abs);
    const stat = await fs.stat(abs);
    return {
      path: rel,
      sha256: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16),
      bytes: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  } catch (e: any) {
    return { path: rel, sha256: null, bytes: null, mtime: null };
  }
}

export async function integrity(): Promise<Array<{ path: string; sha256: string | null; bytes: number | null; mtime: string | null }>> {
  return Promise.all(CRITICAL_FILES.map(fileHash));
}

/** Full reflection — creator's omniscient view. */
export async function reflect() {
  const [sentinelStatus, integ, secretsStat] = await Promise.all([
    Promise.resolve(sentinel.status()),
    integrity(),
    secrets.statusAll(),
  ]);

  let agentSnap: any = null;
  let revenueSnap: any = null;
  let activitySnap: any = null;
  try { agentSnap    = await store.getAgentState(); } catch {}
  try {
    const subs = await store.listSubscribers();
    const now2 = Date.now();
    const active = subs.filter((s) => s.isActive && (!s.expiresAt || s.expiresAt.getTime() > now2));
    revenueSnap = {
      pro: active.filter((s) => s.plan === "pro").length,
      elite: active.filter((s) => s.plan === "elite").length,
      total: active.length,
    };
  } catch {}
  try { activitySnap = await store.listActivity(10); } catch {}

  return {
    organism: sentinelStatus.organism,
    killSwitch: killSwitchActive,
    sentinel: sentinelStatus,
    eye: eye.worldView(),
    integrity: integ,
    secretsPresent: secretsStat.map((s) => ({ key: s.key, configured: s.configured, source: s.source })),
    state: {
      agent: agentSnap,
      revenue: revenueSnap,
      recentActivity: activitySnap,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function pulse(): { ok: boolean; ts: string } {
  // Bumps a beat marker so all heartbeat consumers see "fresh"
  sentinel.recordBeat("manual-pulse", 1000);
  return { ok: true, ts: new Date().toISOString() };
}

export function heal(): { healedModules: number; clearedQuarantines: number } {
  const s = sentinel.status();
  let healed = 0;
  let quarLifted = 0;
  for (const m of s.modules) {
    if (m.state !== "healthy") {
      sentinel.trackOk(m.name);
      healed++;
      if (m.state === "quarantined") quarLifted++;
    }
  }
  logger.info({ healed, quarLifted }, "[MIRROR] heal command executed");
  return { healedModules: healed, clearedQuarantines: quarLifted };
}
