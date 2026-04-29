import { Router, type IRouter } from "express";
import * as store from "../services/store";

const router: IRouter = Router();

// Re-exported helper used by monetization webhook (keeps the same import path)
export async function creditCPA(referrerId: string, amountTon: number, desc: string, txHash?: string) {
  await store.creditCPA(referrerId, amountTon, desc, txHash);
}

export async function creditBounty(userId: string, amountTon: number, desc: string) {
  const share = amountTon * 0.9;
  await store.ledgerInsert({ telegramId: userId, type: "bounty", amountTon: share, description: desc });
}

router.get("/billing/balance/:telegramId", async (req, res) => {
  const id = req.params.telegramId;
  const [balance, sub] = await Promise.all([store.ledgerBalance(id), store.getSubscriber(id)]);
  res.json({
    telegramId: id,
    balance_ton:    parseFloat(balance.toFixed(4)),
    pending_ton:    0,
    plan:           sub?.plan || "free",
    can_withdraw:   balance >= 0.5,
    min_withdrawal: 0.5,
    wallet:         sub?.tonAddress || null,
  });
});

router.post("/billing/withdraw", async (req, res) => {
  const { telegram_id, ton_address, amount } = req.body || {};
  if (!telegram_id || !ton_address) return res.status(400).json({ error: "telegram_id and ton_address required" });

  const id = String(telegram_id);
  const balance = await store.ledgerBalance(id);
  const requested = parseFloat(amount) || balance;

  if (requested < 0.5)         return res.status(400).json({ error: "Minimum withdrawal is 0.5 TON" });
  if (requested > balance)     return res.status(400).json({ error: "Insufficient balance" });

  await store.ledgerInsert({
    telegramId: id, type: "withdrawal", amountTon: -requested,
    description: `Withdrawal to ${ton_address.slice(0, 10)}...`,
  });

  // Update wallet on subscriber record
  const sub = await store.getSubscriber(id);
  if (sub) await store.upsertSubscriber({ telegramId: id, plan: sub.plan, tonAddress: ton_address, isActive: sub.isActive });

  await store.logActivity("BILLING", "Withdrawal queued", `${requested.toFixed(4)} TON to ${ton_address.slice(0, 10)}...`, "info", { telegramId: id, ton_address, amount: requested });

  const remaining = await store.ledgerBalance(id);
  res.json({
    success: true,
    withdrawn_ton: requested.toFixed(4),
    to_address: ton_address,
    remaining_balance: remaining.toFixed(4),
    tx_note: "Queued for on-chain send via Reserve Fund wallet",
    reserve_wallet: store.RESERVE,
  });
});

router.get("/billing/history/:telegramId", async (req, res) => {
  const id = req.params.telegramId;
  const history = await store.ledgerHistory(id, 100);
  res.json({ telegramId: id, history, total: history.length });
});

// AUTO-EARN distribution stats (passive yield for ELITE/PRO subscribers)
router.get("/billing/auto-earn/stats", async (_req, res) => {
  const subs = await store.listSubscribers();
  const now = Date.now();
  const active = subs.filter((s) => s.isActive && (!s.expiresAt || s.expiresAt.getTime() > now));
  const elite = active.filter((s) => s.plan === "elite").length;
  const pro   = active.filter((s) => s.plan === "pro").length;

  const ELITE = 0.0010, PRO = 0.0003, INTERVAL = 6;
  const cyclesPerDay = (24 * 60) / INTERVAL;

  const history = await store.ledgerHistory("__all__", 1).catch(() => []);
  // Aggregate distributed for today via raw query through store helper (re-use stats)
  const stats = await store.ledgerStats();

  res.json({
    activeSubscribers: { elite, pro, total: elite + pro },
    rates: { elitePerCycle: ELITE, proPerCycle: PRO, intervalMin: INTERVAL },
    perDay: {
      elite: (ELITE * cyclesPerDay).toFixed(4),
      pro:   (PRO * cyclesPerDay).toFixed(4),
    },
    perCycleDistribution: ((elite * ELITE) + (pro * PRO)).toFixed(4),
    perDayDistribution:   (((elite * ELITE) + (pro * PRO)) * cyclesPerDay).toFixed(4),
    totalDistributedAllTime: parseFloat(stats.total_distributed).toFixed(4),
    nextRunMin: INTERVAL,
    historySample: history.length,
  });
});

// User-specific auto-earn slice
router.get("/billing/auto-earn/:telegramId", async (req, res) => {
  const id  = req.params.telegramId;
  const all = await store.ledgerHistory(id, 100);
  const autoEarn = all.filter((e) => e.type === "auto_earn");
  const totalAutoEarn = autoEarn.reduce((sum, e) => sum + parseFloat(e.amountTon as any), 0);
  const sub = await store.getSubscriber(id);
  res.json({
    telegramId: id,
    plan: sub?.plan ?? "free",
    isActive: sub?.isActive ?? false,
    autoEarnTotal: totalAutoEarn.toFixed(6),
    autoEarnEvents: autoEarn.length,
    nextEarn: sub?.plan === "elite" ? 0.0010 : sub?.plan === "pro" ? 0.0003 : 0,
    last5: autoEarn.slice(0, 5),
  });
});

router.get("/billing/stats", async (_req, res) => {
  const s = await store.ledgerStats();
  res.json({
    total_distributed_ton: parseFloat(s.total_distributed).toFixed(2),
    cpa_paid_ton:          parseFloat(s.cpa_paid).toFixed(2),
    bounty_paid_ton:       parseFloat(s.bounty_paid).toFixed(2),
    active_accounts:       s.active_accounts,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
