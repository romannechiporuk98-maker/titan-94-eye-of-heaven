/**
 * AUTO-EARN cycle — passive yield distribution to active subscribers.
 *
 * Source: arbitrage profits + bug bounty pool (Reserve Fund).
 * Distribution every 6 minutes:
 *   ELITE → 0.0010 TON (≈ 0.24 TON/day)
 *   PRO   → 0.0003 TON (≈ 0.072 TON/day)
 *   FREE  → 0
 *
 * Each subscriber accrues to their billing_ledger as type="auto_earn".
 * They can withdraw via existing /api/billing/withdraw once balance ≥ 0.5 TON.
 */
import { logger } from "../lib/logger";
import * as store from "./store";
import { getSettings } from "./creator";

export async function runAutoEarn() {
  const settings = await getSettings();
  if (!settings.autoEarnEnabled) {
    logger.debug("[AUTO-EARN] disabled by creator settings");
    return { elite: 0, pro: 0, developer: 0, distributed: 0, skipped: true };
  }

  const subs = await store.listSubscribers();
  const now  = Date.now();
  const active = subs.filter((s) => s.isActive && (!s.expiresAt || s.expiresAt.getTime() > now));

  let elite = 0, pro = 0, developer = 0, distributed = 0;
  for (const s of active) {
    let amt = 0;
    if (s.plan === "elite")          { amt = settings.elitePerCycle;     elite++; }
    else if (s.plan === "pro")       { amt = settings.proPerCycle;       pro++; }
    else if (s.plan === "developer") { amt = settings.developerPerCycle; developer++; }
    if (amt > 0) {
      await store.ledgerInsert({
        telegramId: s.telegramId,
        type: "auto_earn",
        amountTon: amt,
        description: `Passive yield · ${s.plan.toUpperCase()} tier`,
      });
      distributed += amt;
    }
  }

  await store.logActivity(
    "AUTO-EARN",
    `Distributed ${distributed.toFixed(4)} TON to ${elite + pro + developer} subscribers`,
    `${elite}×ELITE + ${pro}×PRO + ${developer}×DEV = ${distributed.toFixed(4)} TON`,
    "info",
    { elite, pro, developer, distributed },
  );
  logger.debug({ elite, pro, developer, distributed }, "[AUTO-EARN] cycle complete");
  return { elite, pro, developer, distributed };
}

// Live-rate getter (used by /api/billing/auto-earn/stats etc.)
export async function getRates() {
  const s = await getSettings();
  return {
    elitePerCycle: s.elitePerCycle,
    proPerCycle: s.proPerCycle,
    developerPerCycle: s.developerPerCycle,
    intervalMin: s.autoEarnIntervalMin,
  };
}

export const RATES = { elitePerCycle: 0.0010, proPerCycle: 0.0003, intervalMin: 6 };
