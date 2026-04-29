/**
 * EYE OF GOD (ОКО НЕБЕСНЕ) — global situational awareness + dedup index.
 *
 * Every event the organism observes (TX, scan-result, vuln-finding, payment)
 * is fingerprinted and stored. Any module asking "have we seen this?" gets
 * O(1) lookup so duplicate work is impossible across the entire ecosystem.
 *
 * Also exposes a unified "world-view" snapshot: counts of seen entities by
 * category, top sources, last 50 events for the creator panel.
 */
import crypto from "crypto";

interface SeenEntry { fp: string; cat: string; meta?: any; at: number; }
interface CatStats   { total: number; firstAt: number; lastAt: number; }

const MAX_SEEN  = 100_000;       // soft ring buffer
const RECENT_MAX = 200;
const SEEN: Map<string, SeenEntry> = new Map();
const RECENT: SeenEntry[] = [];
const CAT: Map<string, CatStats> = new Map();

function now(): number { return Date.now(); }

function fingerprint(parts: any[]): string {
  return crypto.createHash("sha256").update(parts.map(String).join("|")).digest("hex").slice(0, 32);
}

/**
 * Mark something as observed. Returns true if NEW, false if already seen.
 * Use for every tx/event/scan to prevent duplicate processing organism-wide.
 */
export function observe(category: string, identityParts: any[], meta?: any): boolean {
  const fp = fingerprint([category, ...identityParts]);
  if (SEEN.has(fp)) return false;
  const entry: SeenEntry = { fp, cat: category, meta, at: now() };
  SEEN.set(fp, entry);
  RECENT.unshift(entry);
  if (RECENT.length > RECENT_MAX) RECENT.pop();

  const c = CAT.get(category) || { total: 0, firstAt: entry.at, lastAt: entry.at };
  c.total++;
  c.lastAt = entry.at;
  CAT.set(category, c);

  // soft trim
  if (SEEN.size > MAX_SEEN) {
    const toDrop = Math.floor(SEEN.size * 0.05);
    let n = 0;
    for (const k of SEEN.keys()) {
      if (n++ >= toDrop) break;
      SEEN.delete(k);
    }
  }
  return true;
}

/** Have we seen this exact thing before? */
export function hasSeen(category: string, identityParts: any[]): boolean {
  return SEEN.has(fingerprint([category, ...identityParts]));
}

/** Lookup by fingerprint. */
export function findByFp(fp: string): SeenEntry | undefined { return SEEN.get(fp); }

/** Global situational awareness snapshot. */
export function worldView() {
  const cats = Array.from(CAT.entries()).map(([cat, s]) => ({
    category: cat,
    total: s.total,
    firstSeen: new Date(s.firstAt).toISOString(),
    lastSeen: new Date(s.lastAt).toISOString(),
    ageHours: Math.round((now() - s.firstAt) / 3600_000 * 10) / 10,
  })).sort((a, b) => b.total - a.total);

  return {
    totalObservations: SEEN.size,
    uniqueCategories: cats.length,
    categories: cats,
    recent: RECENT.slice(0, 50).map((r) => ({
      cat: r.cat, fp: r.fp, at: new Date(r.at).toISOString(), meta: r.meta,
    })),
    awarenessLevel: SEEN.size > 1000 ? "OMNISCIENT" : SEEN.size > 100 ? "VIGILANT" : "OBSERVING",
  };
}

export function clearCategory(cat: string): number {
  let removed = 0;
  for (const [k, v] of SEEN) {
    if (v.cat === cat) { SEEN.delete(k); removed++; }
  }
  CAT.delete(cat);
  for (let i = RECENT.length - 1; i >= 0; i--) if (RECENT[i].cat === cat) RECENT.splice(i, 1);
  return removed;
}
