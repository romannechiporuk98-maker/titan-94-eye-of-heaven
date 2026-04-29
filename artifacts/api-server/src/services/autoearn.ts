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

const ELITE_PER_CYCLE = 0.0010;
const PRO_PER_CYCLE   = 0.0003;

export async function runAutoEarn() {
  const subs = await store.listSubscribers();
  const now  = Date.now();
  const active = subs.filter((s) => s.isActive && (!s.expiresAt || s.expiresAt.getTime() > now));

  let elite = 0, pro = 0, distributed = 0;
  for (const s of active) {
    let amt = 0;
    if (s.plan === "elite") { amt = ELITE_PER_CYCLE; elite++; }
    else if (s.plan === "pro") { amt = PRO_PER_CYCLE; pro++; }
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
    `Distributed ${distributed.toFixed(4)} TON to ${elite + pro} subscribers`,
    `${elite} ELITE × ${ELITE_PER_CYCLE} + ${pro} PRO × ${PRO_PER_CYCLE} = ${distributed.toFixed(4)} TON`,
    "info",
    { elite, pro, distributed },
  );
  logger.debug({ elite, pro, distributed }, "[AUTO-EARN] cycle complete");
  return { elite, pro, distributed };
}

export const RATES = { elitePerCycle: ELITE_PER_CYCLE, proPerCycle: PRO_PER_CYCLE, intervalMin: 6 };
