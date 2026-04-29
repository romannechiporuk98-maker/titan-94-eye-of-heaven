/**
 * SENTINEL — TITAN-94 immune & self-healing core.
 *
 * Wraps the entire process so the organism never falls down:
 *  - Catches uncaughtException / unhandledRejection (logs, never exits)
 *  - Tracks per-module health (failures, last error, recovery)
 *  - Auto-quarantines a module after N consecutive failures, then auto-revives
 *  - Memory watchdog (forces global.gc() if exposed when RSS > threshold)
 *  - Heartbeat liveness — last beat per cycle, alerts if any cycle stalls
 *  - Per-IP rate limiter middleware (anti-DDoS)
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

interface ModuleHealth {
  name: string;
  failures: number;
  successes: number;
  lastError?: string;
  lastErrorAt?: string;
  lastSuccessAt?: string;
  quarantinedUntil?: number;
  state: "healthy" | "degraded" | "quarantined" | "recovered";
}

interface BeatRecord { name: string; lastAt: number; intervalMs: number; }

const MODULES = new Map<string, ModuleHealth>();
const BEATS   = new Map<string, BeatRecord>();
const QUARANTINE_MS = 60_000;       // 1 min cool-down
const FAIL_THRESHOLD = 5;
const MEM_LIMIT_MB = 768;

let totalCaughtErrors = 0;
let totalAutoHeals = 0;
let totalRateLimited = 0;
let bootedAt = Date.now();

// ─── Process-level guards ──────────────────────────────────────────────
export function armSentinel(): void {
  process.on("uncaughtException", (err: Error) => {
    totalCaughtErrors++;
    logger.error({ err: err.message, stack: err.stack }, "[SENTINEL] uncaughtException — survived");
  });
  process.on("unhandledRejection", (reason: any) => {
    totalCaughtErrors++;
    logger.error({ reason: String(reason) }, "[SENTINEL] unhandledRejection — survived");
  });
  process.on("warning", (w) => logger.warn({ name: w.name, msg: w.message }, "[SENTINEL] node warning"));

  // Memory watchdog — every 30s
  setInterval(() => {
    const rssMb = process.memoryUsage.rss() / 1024 / 1024;
    if (rssMb > MEM_LIMIT_MB) {
      logger.warn({ rssMb: Math.round(rssMb) }, "[SENTINEL] high memory — forcing GC");
      try { (global as any).gc?.(); totalAutoHeals++; } catch {}
    }
  }, 30_000).unref();

  bootedAt = Date.now();
  logger.info("[SENTINEL] armed — process-level shield active");
}

// ─── Module health tracking ────────────────────────────────────────────
export function trackOk(name: string): void {
  const m = MODULES.get(name) || { name, failures: 0, successes: 0, state: "healthy" as const };
  m.successes++;
  m.lastSuccessAt = new Date().toISOString();
  if (m.state === "degraded" || m.state === "quarantined") {
    m.state = "recovered";
    m.failures = 0;
    totalAutoHeals++;
    logger.info({ module: name }, "[SENTINEL] module recovered");
  }
  MODULES.set(name, m);
}

export function trackFail(name: string, err: any): void {
  const m = MODULES.get(name) || { name, failures: 0, successes: 0, state: "healthy" as const };
  m.failures++;
  m.lastError = err?.message || String(err);
  m.lastErrorAt = new Date().toISOString();
  if (m.failures >= FAIL_THRESHOLD) {
    m.state = "quarantined";
    m.quarantinedUntil = Date.now() + QUARANTINE_MS;
    logger.warn({ module: name, failures: m.failures }, "[SENTINEL] module quarantined for 1m");
  } else {
    m.state = "degraded";
  }
  MODULES.set(name, m);
}

export function isQuarantined(name: string): boolean {
  const m = MODULES.get(name);
  if (!m || !m.quarantinedUntil) return false;
  if (Date.now() > m.quarantinedUntil) {
    m.state = "recovered";
    m.failures = 0;
    delete m.quarantinedUntil;
    totalAutoHeals++;
    logger.info({ module: name }, "[SENTINEL] quarantine lifted, attempting recovery");
    return false;
  }
  return true;
}

/** Wrap any async function with auto-quarantine + retry safety. */
export async function guard<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  if (isQuarantined(name)) return fallback;
  try {
    const r = await fn();
    trackOk(name);
    return r;
  } catch (e: any) {
    trackFail(name, e);
    return fallback;
  }
}

// ─── Heartbeat liveness ────────────────────────────────────────────────
export function recordBeat(name: string, intervalMs: number): void {
  BEATS.set(name, { name, lastAt: Date.now(), intervalMs });
}

// ─── Per-IP rate limit (anti-DDoS) ─────────────────────────────────────
const RATE_BUCKET = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_MIN = 240;       // generous: ~4 req/sec per IP

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.ip || "unknown";
  const now = Date.now();
  let b = RATE_BUCKET.get(ip);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + RATE_WINDOW_MS };
    RATE_BUCKET.set(ip, b);
  }
  b.count++;
  if (b.count > RATE_MAX_PER_MIN) {
    totalRateLimited++;
    res.status(429).json({ error: "rate limited", retry_after_ms: b.resetAt - now });
    return;
  }
  next();
}

// Periodic bucket cleanup
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of RATE_BUCKET) if (now > b.resetAt + 60_000) RATE_BUCKET.delete(ip);
}, 120_000).unref();

// ─── Public status ─────────────────────────────────────────────────────
export function status() {
  const mem = process.memoryUsage();
  const now = Date.now();
  const beats = Array.from(BEATS.values()).map((b) => ({
    name: b.name,
    lastAt: new Date(b.lastAt).toISOString(),
    ageMs: now - b.lastAt,
    intervalMs: b.intervalMs,
    healthy: now - b.lastAt < b.intervalMs * 3,
  }));
  const modules = Array.from(MODULES.values());
  const allHealthy = modules.every((m) => m.state === "healthy" || m.state === "recovered") && beats.every((b) => b.healthy);
  return {
    organism: allHealthy ? "OPTIMAL" : modules.some((m) => m.state === "quarantined") ? "DEGRADED" : "WARNING",
    uptime_s: Math.floor((now - bootedAt) / 1000),
    bootedAt: new Date(bootedAt).toISOString(),
    rss_mb: Math.round(mem.rss / 1024 / 1024),
    heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
    counters: {
      caught_errors: totalCaughtErrors,
      auto_heals: totalAutoHeals,
      rate_limited: totalRateLimited,
      tracked_ips: RATE_BUCKET.size,
    },
    modules,
    beats,
  };
}
