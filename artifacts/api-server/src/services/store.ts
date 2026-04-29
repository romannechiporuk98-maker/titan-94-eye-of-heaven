/**
 * TITAN-94 Persistent Store
 * DB-backed wrappers for vulnerabilities / activity / knowledge / subscribers / billing.
 * All routes & heartbeat read/write through here.
 */
import {
  db,
  vulnerabilitiesTable, activityTable, knowledgeTable,
  subscribersTable, agentStateTable, billingLedgerTable,
  tonPaymentsTable, blockedAddressesTable,
  ensureSeed,
  type Vulnerability, type Activity, type Knowledge,
  type Subscriber, type AgentState, type BillingLedger,
} from "@workspace/db";
import { and, desc, eq, sql, isNull } from "drizzle-orm";

const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

// ─── Bootstrap ───────────────────────────────────────────────────────
export async function bootstrap(): Promise<{ counts: Record<string, number> }> {
  return await ensureSeed();
}

// ─── Agent state (singleton id=1) ────────────────────────────────────
export async function getAgentState(): Promise<AgentState> {
  const rows = await db.select().from(agentStateTable).where(eq(agentStateTable.id, 1)).limit(1);
  if (rows.length) return rows[0]!;
  await db.insert(agentStateTable).values({ id: 1 } as any).onConflictDoNothing();
  const again = await db.select().from(agentStateTable).where(eq(agentStateTable.id, 1)).limit(1);
  return again[0]!;
}

export async function bumpCycle(
  field: "cycles" | "healingCycles" | "learnCycles" | "financeCycles",
  ts: { lastScan?: Date; lastHeal?: Date; lastLearn?: Date; lastFinance?: Date } = {},
  extras: Partial<{ accuracy: string; threatsHealed: number; knowledgeSize: number; lastBlockSeqno: number }> = {},
): Promise<AgentState> {
  const colMap: Record<string, any> = {
    cycles: agentStateTable.cycles,
    healingCycles: agentStateTable.healingCycles,
    learnCycles: agentStateTable.learnCycles,
    financeCycles: agentStateTable.financeCycles,
  };
  const set: Record<string, any> = {
    [field]: sql`${colMap[field]} + 1`,
    updatedAt: new Date(),
    ...ts,
    ...extras,
  };
  const updated = await db.update(agentStateTable).set(set).where(eq(agentStateTable.id, 1)).returning();
  return updated[0]!;
}

// ─── Vulnerabilities ─────────────────────────────────────────────────
export async function listVulnerabilities(opts: { severity?: string; status?: string; limit?: number; offset?: number } = {}) {
  const conds: any[] = [];
  if (opts.severity) conds.push(eq(vulnerabilitiesTable.severity, opts.severity as any));
  if (opts.status)   conds.push(eq(vulnerabilitiesTable.status,   opts.status   as any));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db.select().from(vulnerabilitiesTable)
    .where(where as any)
    .orderBy(desc(vulnerabilitiesTable.discoveredAt))
    .limit(opts.limit ?? 100).offset(opts.offset ?? 0);

  const total = await db.select({ c: sql<number>`count(*)::int` }).from(vulnerabilitiesTable).where(where as any);
  return { rows, total: total[0]!.c };
}

export async function vulnStats() {
  const r = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE severity='critical')::int  AS critical,
      COUNT(*) FILTER (WHERE severity='high')::int      AS high,
      COUNT(*) FILTER (WHERE severity='medium')::int    AS medium,
      COUNT(*) FILTER (WHERE severity='low')::int       AS low,
      COUNT(*) FILTER (WHERE status='active')::int      AS active,
      COUNT(*) FILTER (WHERE status='healing')::int     AS healing,
      COUNT(*) FILTER (WHERE status='healed')::int      AS healed,
      COUNT(*)::int                                     AS total,
      COALESCE(SUM(tvl_at_risk) FILTER (WHERE status='active'), 0)::text AS tvl_at_risk
    FROM vulnerabilities
  `);
  return r.rows[0] as any;
}

export async function findVulnerability(idOrExternal: string): Promise<Vulnerability | null> {
  const numeric = Number(idOrExternal);
  const rows = await db.select().from(vulnerabilitiesTable)
    .where(Number.isInteger(numeric) ? eq(vulnerabilitiesTable.id, numeric) : eq(vulnerabilitiesTable.externalId, idOrExternal))
    .limit(1);
  return rows[0] ?? null;
}

export async function addVulnerability(v: {
  externalId?: string; title: string; severity: "critical" | "high" | "medium" | "low" | "info";
  protocol?: string; contractAddress?: string; tvlAtRisk?: string; category?: string;
}): Promise<Vulnerability> {
  const ext = v.externalId || `CVE-T94-${Date.now().toString().slice(-6)}`;
  const inserted = await db.insert(vulnerabilitiesTable).values({
    externalId: ext, title: v.title, severity: v.severity,
    protocol: v.protocol ?? "Unknown", contractAddress: v.contractAddress,
    tvlAtRisk: v.tvlAtRisk, status: "active", category: v.category,
  }).onConflictDoNothing().returning();
  if (inserted.length) return inserted[0]!;
  const found = await findVulnerability(ext);
  return found!;
}

export async function getNextActiveUnhealed(): Promise<Vulnerability | null> {
  const rows = await db.select().from(vulnerabilitiesTable)
    .where(and(eq(vulnerabilitiesTable.status, "active"), isNull(vulnerabilitiesTable.healingPlan)))
    .orderBy(desc(vulnerabilitiesTable.discoveredAt)).limit(1);
  return rows[0] ?? null;
}

export async function setHealingPlan(id: number, plan: string) {
  await db.update(vulnerabilitiesTable).set({ status: "healing", healingPlan: plan }).where(eq(vulnerabilitiesTable.id, id));
}
export async function markHealed(id: number) {
  await db.update(vulnerabilitiesTable).set({ status: "healed", healedAt: new Date() }).where(eq(vulnerabilitiesTable.id, id));
}

// ─── Activity ────────────────────────────────────────────────────────
export async function logActivity(type: string, title: string, message: string, severity = "info", metadata?: Record<string, unknown>) {
  await db.insert(activityTable).values({
    type, title, message, severity, metadata: metadata as any,
  });
  // Keep table bounded
  await db.execute(sql`DELETE FROM activity WHERE id IN (SELECT id FROM activity ORDER BY created_at DESC OFFSET 500)`);
}

export async function listActivity(limit = 50, offset = 0): Promise<Activity[]> {
  return await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(limit).offset(offset);
}

export async function activityCount(): Promise<number> {
  const r = await db.select({ c: sql<number>`count(*)::int` }).from(activityTable);
  return r[0]!.c;
}

// ─── Knowledge ───────────────────────────────────────────────────────
export async function listKnowledge(limit = 100): Promise<Knowledge[]> {
  return await db.select().from(knowledgeTable).orderBy(desc(knowledgeTable.createdAt)).limit(limit);
}
export async function knowledgeCount(): Promise<number> {
  const r = await db.select({ c: sql<number>`count(*)::int` }).from(knowledgeTable);
  return r[0]!.c;
}
export async function addKnowledge(entry: { category: string; pattern: string; description?: string; confidence: string; source: string }) {
  await db.insert(knowledgeTable).values({
    category: entry.category, pattern: entry.pattern.slice(0, 200),
    description: entry.description, confidence: entry.confidence, source: entry.source, occurrences: 1,
  });
  await db.execute(sql`DELETE FROM knowledge WHERE id IN (SELECT id FROM knowledge ORDER BY created_at DESC OFFSET 200)`);
}

// ─── Subscribers ─────────────────────────────────────────────────────
export async function getSubscriber(telegramId: string): Promise<Subscriber | null> {
  const rows = await db.select().from(subscribersTable).where(eq(subscribersTable.telegramId, telegramId)).limit(1);
  return rows[0] ?? null;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return await db.select().from(subscribersTable).orderBy(desc(subscribersTable.createdAt));
}

export async function upsertSubscriber(s: {
  telegramId: string; username?: string | null; plan: "free" | "pro" | "elite";
  tonAddress?: string | null; expiresAt?: Date | null; isActive?: boolean; referredBy?: string | null;
}) {
  await db.insert(subscribersTable).values({
    telegramId: s.telegramId, username: s.username ?? null,
    plan: s.plan, tonAddress: s.tonAddress ?? null,
    expiresAt: s.expiresAt ?? null, isActive: s.isActive ?? true, referredBy: s.referredBy ?? null,
  }).onConflictDoUpdate({
    target: subscribersTable.telegramId,
    set: {
      username:   s.username ?? sql`subscribers.username`,
      plan:       s.plan,
      tonAddress: s.tonAddress ?? sql`subscribers.ton_address`,
      expiresAt:  s.expiresAt  ?? sql`subscribers.expires_at`,
      isActive:   s.isActive ?? true,
      referredBy: s.referredBy ?? sql`subscribers.referred_by`,
    },
  });
  return (await getSubscriber(s.telegramId))!;
}

// ─── Billing ledger ──────────────────────────────────────────────────
export async function ledgerInsert(entry: {
  telegramId: string; type: string; amountTon: number; description: string; txHash?: string;
}) {
  await db.insert(billingLedgerTable).values({
    telegramId: entry.telegramId, type: entry.type,
    amountTon: entry.amountTon.toFixed(9), description: entry.description, txHash: entry.txHash,
  });
}

export async function ledgerBalance(telegramId: string): Promise<number> {
  const r = await db.execute(sql`
    SELECT COALESCE(SUM(amount_ton::numeric), 0)::text AS balance
    FROM billing_ledger WHERE telegram_id = ${telegramId}
  `);
  return parseFloat((r.rows[0] as any).balance);
}

export async function ledgerHistory(telegramId: string, limit = 50): Promise<BillingLedger[]> {
  return await db.select().from(billingLedgerTable)
    .where(eq(billingLedgerTable.telegramId, telegramId))
    .orderBy(desc(billingLedgerTable.createdAt)).limit(limit);
}

export async function ledgerStats() {
  const r = await db.execute(sql`
    SELECT
      COALESCE(SUM(amount_ton::numeric) FILTER (WHERE amount_ton::numeric > 0), 0)::text AS total_distributed,
      COALESCE(SUM(amount_ton::numeric) FILTER (WHERE type='cpa'), 0)::text     AS cpa_paid,
      COALESCE(SUM(amount_ton::numeric) FILTER (WHERE type='bounty'), 0)::text  AS bounty_paid,
      COUNT(DISTINCT telegram_id)::int                                          AS active_accounts
    FROM billing_ledger
  `);
  return r.rows[0] as any;
}

// ─── Helpers used by monetization / webhook ─────────────────────────
export async function creditCPA(referrerId: string, paymentTon: number, desc: string, txHash?: string) {
  const cpa = paymentTon * 0.15;
  await ledgerInsert({ telegramId: referrerId, type: "cpa", amountTon: cpa, description: desc, txHash });
}

// ─── TON payments table ──────────────────────────────────────────────
export async function recordTonPayment(p: {
  txHash: string; fromAddress: string; toAddress: string;
  amountNano: string; comment?: string; telegramId?: string; planActivated?: string; verified: boolean;
}) {
  await db.insert(tonPaymentsTable).values({
    txHash: p.txHash, fromAddress: p.fromAddress, toAddress: p.toAddress,
    amountNano: p.amountNano, amountTon: (parseInt(p.amountNano) / 1e9).toFixed(9),
    comment: p.comment, telegramId: p.telegramId, planActivated: p.planActivated, verified: p.verified,
  }).onConflictDoNothing();
}

export async function findPayment(txHash: string) {
  const rows = await db.select().from(tonPaymentsTable).where(eq(tonPaymentsTable.txHash, txHash)).limit(1);
  return rows[0] ?? null;
}

// ─── Blocked addresses ──────────────────────────────────────────────
export async function blockAddress(address: string, reason: string, severity = "high") {
  await db.insert(blockedAddressesTable).values({ address, reason, severity, source: "titan94" }).onConflictDoNothing();
}

export const RESERVE = RESERVE_WALLET;
