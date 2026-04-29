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
