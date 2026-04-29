import { db } from "./index";
import {
  vulnerabilitiesTable, activityTable, knowledgeTable,
  subscribersTable, agentStateTable, competitorsTable,
} from "./schema";
import { sql } from "drizzle-orm";

const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";
const ADMIN_TG_ID    = process.env.ADMIN_TELEGRAM_ID || "7255058720";

const SEED_VULNS = [
  { externalId: "CVE-T94-001", title: "Unchecked Send in DEX Router", severity: "critical" as const, protocol: "DeDust",  contractAddress: "EQAFHodWCzrYJTb...", tvlAtRisk: "124000", status: "active" as const,  category: "Reentrancy",     healingPlan: null },
  { externalId: "CVE-T94-002", title: "Missing Access Control on Owner Function", severity: "high" as const,     protocol: "STON.fi", contractAddress: "EQCgYmwi8uwrG7...", tvlAtRisk: "45000",  status: "healing" as const, category: "Access Control", healingPlan: "Add require(sender() == self.owner) guard" },
  { externalId: "CVE-T94-003", title: "Integer Overflow in Jetton Minter",       severity: "high" as const,     protocol: "Custom",   contractAddress: "EQD5ZZ1...",       tvlAtRisk: "8200",   status: "active" as const,  category: "Arithmetic",     healingPlan: null },
  { externalId: "CVE-T94-004", title: "Front-running in Auction Contract",        severity: "medium" as const,   protocol: "Fragment", contractAddress: "EQB1Xz...",        tvlAtRisk: "3100",   status: "healed" as const,  category: "MEV",            healingPlan: "Commit-reveal scheme implemented" },
  { externalId: "CVE-T94-005", title: "Bounce handler missing — fund drain risk", severity: "medium" as const,   protocol: "Custom",   contractAddress: "EQ9kL...",         tvlAtRisk: "1800",   status: "active" as const,  category: "TON-Specific",   healingPlan: null },
];

const SEED_ACTIVITY = [
  { type: "SCAN",    title: "Masterchain block scanned",   message: "Block #47291034 — 3 new contracts detected", severity: "info" },
  { type: "THREAT",  title: "Critical vulnerability found", message: "CVE-T94-001: Unchecked Send in DEX Router — 124K TON at risk", severity: "critical" },
  { type: "HEAL",    title: "Healing plan generated",       message: "CVE-T94-002: Gemini 2.5 generated fix plan (confidence 94%)", severity: "success" },
  { type: "LEARN",   title: "New pattern learned",          message: "Access-control bypass #47 added to knowledge base", severity: "info" },
  { type: "FINANCE", title: "Revenue check",                message: "1 ELITE active · Reserve: monitoring", severity: "info" },
];

const SEED_KNOWLEDGE = [
  { category: "reentrancy",     pattern: "send.*balance.*require",         description: "Reentrancy via send before state update", confidence: "0.94", occurrences: 12, source: "heartbeat" },
  { category: "access_control", pattern: "receive.*without.*sender",       description: "Missing sender validation in receive",    confidence: "0.91", occurrences: 28, source: "heartbeat" },
  { category: "arithmetic",     pattern: "uint.*\\+.*without.*check",       description: "Potential overflow in arithmetic ops",    confidence: "0.88", occurrences: 7,  source: "gemini" },
  { category: "scam",           pattern: "send.*double|guaranteed.*ton",   description: "Scam pattern: double/guaranteed returns", confidence: "0.97", occurrences: 45, source: "telegram" },
  { category: "honeypot",       pattern: "transfer.*blacklist|owner.*block", description: "HoneyPot: owner can block transfers",   confidence: "0.93", occurrences: 19, source: "heartbeat" },
];

const SEED_COMPETITORS = [
  { name: "DeDust",       description: "TON DEX with v2 AMM",          tvl: "12500000", chain: "TON", threatLevel: "low",    website: "https://dedust.io" },
  { name: "STON.fi",      description: "First TON AMM protocol",       tvl: "23800000", chain: "TON", threatLevel: "low",    website: "https://ston.fi" },
  { name: "Megaton",      description: "Aggregator + Lending",         tvl: "4200000",  chain: "TON", threatLevel: "medium", website: "https://megaton.fi" },
  { name: "Tonstakers",   description: "Liquid staking protocol",      tvl: "75000000", chain: "TON", threatLevel: "low",    website: "https://tonstakers.com" },
];

export async function ensureSeed(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = {};

  // Agent state singleton
  const stateRow = await db.execute(sql`SELECT id FROM agent_state WHERE id=1`);
  if (stateRow.rows.length === 0) {
    await db.insert(agentStateTable).values({ id: 1 } as any).onConflictDoNothing();
  }

  // Vulnerabilities
  const v = await db.execute(sql`SELECT COUNT(*)::int AS c FROM vulnerabilities`);
  counts.vulnerabilities = (v.rows[0] as any).c;
  if (counts.vulnerabilities === 0) {
    await db.insert(vulnerabilitiesTable).values(SEED_VULNS).onConflictDoNothing();
    counts.vulnerabilities = SEED_VULNS.length;
  }

  // Activity
  const a = await db.execute(sql`SELECT COUNT(*)::int AS c FROM activity`);
  counts.activity = (a.rows[0] as any).c;
  if (counts.activity === 0) {
    await db.insert(activityTable).values(SEED_ACTIVITY).onConflictDoNothing();
    counts.activity = SEED_ACTIVITY.length;
  }

  // Knowledge
  const k = await db.execute(sql`SELECT COUNT(*)::int AS c FROM knowledge`);
  counts.knowledge = (k.rows[0] as any).c;
  if (counts.knowledge === 0) {
    await db.insert(knowledgeTable).values(SEED_KNOWLEDGE).onConflictDoNothing();
    counts.knowledge = SEED_KNOWLEDGE.length;
  }

  // Competitors
  const c = await db.execute(sql`SELECT COUNT(*)::int AS c FROM competitors`);
  counts.competitors = (c.rows[0] as any).c;
  if (counts.competitors === 0) {
    await db.insert(competitorsTable).values(SEED_COMPETITORS).onConflictDoNothing();
    counts.competitors = SEED_COMPETITORS.length;
  }

  // Admin always ELITE
  await db.insert(subscribersTable).values({
    telegramId: ADMIN_TG_ID,
    username:   "Cryptoagentton",
    plan:       "elite",
    tonAddress: RESERVE_WALLET,
    expiresAt:  new Date(Date.now() + 365 * 86400000),
    isActive:   true,
  }).onConflictDoUpdate({
    target: subscribersTable.telegramId,
    set:    { plan: "elite", isActive: true, expiresAt: new Date(Date.now() + 365 * 86400000) },
  });

  return { seeded: true, counts };
}
