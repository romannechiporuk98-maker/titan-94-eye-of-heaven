/**
 * TITAN-94 TON Auto-Poller
 *
 * Every 2 minutes:
 *   - reads last 50 transactions of the Reserve wallet
 *   - parses comment of each incoming tx for "tg:<id>:<plan>" format
 *   - if found and not yet processed → activates subscription, credits CPA, sends Telegram notification
 *
 * This makes payments fully automatic without requiring the user to call the webhook themselves.
 */
import { logger } from "../lib/logger";
import * as store from "./store";
import * as ton from "./ton-scanner";
import * as eye from "./eye";
import { sendNotification, sendCriticalAlert } from "./telegram-bot";

const RESERVE = store.RESERVE;
const PRO_MIN  = 4.5,  PRO_MAX  = 5.5;
const ELITE_MIN = 19,  ELITE_MAX = 21;

function parseComment(comment?: string): { telegramId: string | null; plan: "pro" | "elite" | null } {
  if (!comment) return { telegramId: null, plan: null };
  // Accept: "tg:123456:pro" or "tg:123456:elite" or "TITAN94_PRO_<id>" or just "<id>"
  const m1 = comment.match(/tg:(\w+):(pro|elite)/i);
  if (m1) return { telegramId: m1[1]!, plan: m1[2]!.toLowerCase() as "pro" | "elite" };
  const m2 = comment.match(/TITAN94_(PRO|ELITE)_(\w+)/i);
  if (m2) return { telegramId: m2[2]!, plan: m2[1]!.toLowerCase() as "pro" | "elite" };
  const m3 = comment.match(/^(\d{6,12})$/);
  if (m3) return { telegramId: m3[1]!, plan: null };
  return { telegramId: null, plan: null };
}

export async function runTonPoller(): Promise<{ processed: number; activated: number }> {
  const txs = await ton.getRecentTransactions(RESERVE, 50);
  let processed = 0, activated = 0;

  for (const tx of txs) {
    const inMsg = tx.in_msg;
    if (!inMsg) continue;
    if (inMsg.destination !== RESERVE && !inMsg.destination?.endsWith(RESERVE.slice(-10))) continue;

    const txHash = tx.transaction_id.hash;
    // Eye of God dedup — also blocks duplicate processing organism-wide
    if (!eye.observe("ton-tx", [txHash], { dst: inMsg.destination })) continue;
    const existing = await store.findPayment(txHash);
    if (existing) continue;
    processed++;

    const amountTon = parseInt(inMsg.value) / 1e9;
    const { telegramId: parsedId, plan: parsedPlan } = parseComment(inMsg.message);

    let plan: "pro" | "elite" | null = null;
    if (amountTon >= PRO_MIN  && amountTon <= PRO_MAX)  plan = "pro";
    if (amountTon >= ELITE_MIN && amountTon <= ELITE_MAX) plan = "elite";
    if (parsedPlan) plan = parsedPlan;

    if (!plan || !parsedId) {
      // Unknown payment — log but don't activate
      await store.recordTonPayment({
        txHash, fromAddress: inMsg.source || "unknown", toAddress: RESERVE,
        amountNano: inMsg.value, comment: inMsg.message,
        telegramId: parsedId ?? undefined, planActivated: undefined, verified: true,
      }).catch(() => {});
      await store.logActivity(
        "FINANCE", `Unmatched payment: ${amountTon} TON`,
        `from ${(inMsg.source || "?").slice(0, 14)}... — comment="${inMsg.message || ""}"`,
        "warning", { txHash, amountTon, comment: inMsg.message },
      );
      continue;
    }

    // Activate subscription
    const existingSub = await store.getSubscriber(parsedId);
    const expiresAt = new Date(Date.now() + 30 * 86400000);
    await store.upsertSubscriber({
      telegramId: parsedId, username: existingSub?.username || parsedId,
      plan, tonAddress: inMsg.source, expiresAt, isActive: true,
      referredBy: existingSub?.referredBy ?? null,
    });
    await store.recordTonPayment({
      txHash, fromAddress: inMsg.source || "unknown", toAddress: RESERVE,
      amountNano: inMsg.value, comment: inMsg.message,
      telegramId: parsedId, planActivated: plan, verified: true,
    });
    await store.ledgerInsert({
      telegramId: parsedId, type: "subscription", amountTon,
      description: `${plan.toUpperCase()} subscription via TON-POLLER`, txHash,
    });

    // Pay CPA to referrer
    if (existingSub?.referredBy) {
      const cpa = amountTon * 0.15;
      await store.ledgerInsert({
        telegramId: existingSub.referredBy, type: "cpa", amountTon: cpa,
        description: `CPA from ${parsedId} (${plan})`, txHash,
      });
      await sendNotification(existingSub.referredBy, `💰 *CPA payout*\n\nYou earned *${cpa.toFixed(4)} TON* from your referral *${parsedId}* who just upgraded to *${plan.toUpperCase()}*.`).catch(() => {});
    }

    activated++;
    await store.logActivity(
      "FINANCE", `${plan.toUpperCase()} activated by TON-POLLER`,
      `${parsedId} paid ${amountTon} TON · tx ${txHash.slice(0, 10)}...`,
      "success", { telegramId: parsedId, plan, amountTon, txHash },
    );

    // Notify user
    await sendNotification(
      parsedId,
      `🎉 *${plan.toUpperCase()} subscription activated!*\n\n` +
      `Amount: *${amountTon} TON*\n` +
      `Valid until: ${expiresAt.toLocaleDateString()}\n` +
      `TX: \`${txHash.slice(0, 16)}...\`\n\n` +
      `You'll now receive ${plan === "elite" ? "0.24 TON/day" : "0.072 TON/day"} passive yield via auto-earn.`,
    ).catch(() => {});
  }

  if (activated > 0) {
    await sendCriticalAlert(
      "💎 New subscriptions",
      `${activated} payment(s) processed by TON-POLLER. Total processed this cycle: ${processed}.`,
      "medium",
    );
  }

  logger.debug({ processed, activated, scanned: txs.length }, "[TON-POLLER] cycle complete");
  return { processed, activated };
}
