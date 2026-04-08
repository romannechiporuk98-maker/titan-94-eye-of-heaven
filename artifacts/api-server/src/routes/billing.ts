import { Router, type IRouter } from "express";
import { subscribers } from "../services/heartbeat";

const router: IRouter = Router();

// In-memory billing ledger
interface BillingEntry { type: string; amount: number; desc: string; ts: string; }
const billing = new Map<string, { balance: number; history: BillingEntry[] }>();

function getAccount(id: string) {
  if (!billing.has(id)) billing.set(id, { balance: 0, history: [] });
  return billing.get(id)!;
}

export function creditCPA(referrerId: string, amountTon: number, desc: string) {
  const cpa = amountTon * 0.15;
  const acct = getAccount(referrerId);
  acct.balance += cpa;
  acct.history.unshift({ type: "cpa", amount: cpa, desc, ts: new Date().toISOString() });
  if (acct.history.length > 100) acct.history.pop();
}

export function creditBounty(userId: string, amountTon: number, desc: string) {
  const share = amountTon * 0.9; // 90% to user, 10% reserve
  const acct = getAccount(userId);
  acct.balance += share;
  acct.history.unshift({ type: "bounty", amount: share, desc, ts: new Date().toISOString() });
}

// GET /api/billing/balance/:telegramId
router.get("/billing/balance/:telegramId", (req, res) => {
  const { telegramId } = req.params;
  const acct = getAccount(telegramId);
  const sub  = subscribers.get(telegramId);

  res.json({
    telegramId,
    balance_ton:    parseFloat(acct.balance.toFixed(4)),
    pending_ton:    0,
    plan:           sub?.plan || "free",
    can_withdraw:   acct.balance >= 0.5,
    min_withdrawal: 0.5,
    wallet:         sub?.tonAddress || null,
  });
});

// POST /api/billing/withdraw
router.post("/billing/withdraw", (req, res) => {
  const { telegram_id, ton_address, amount } = req.body;
  if (!telegram_id || !ton_address)
    return res.status(400).json({ error: "telegram_id and ton_address required" });

  const acct = getAccount(String(telegram_id));
  const requested = parseFloat(amount) || acct.balance;

  if (requested < 0.5)
    return res.status(400).json({ error: "Minimum withdrawal is 0.5 TON" });
  if (requested > acct.balance)
    return res.status(400).json({ error: "Insufficient balance" });

  acct.balance -= requested;
  acct.history.unshift({
    type: "withdrawal", amount: -requested,
    desc: `Withdrawal to ${ton_address.slice(0, 10)}...`,
    ts: new Date().toISOString(),
  });

  // Update wallet in subscriber record
  const sub = subscribers.get(String(telegram_id));
  if (sub) sub.tonAddress = ton_address;

  res.json({
    success: true,
    withdrawn_ton: requested.toFixed(4),
    to_address: ton_address,
    remaining_balance: acct.balance.toFixed(4),
    // In production: sign & broadcast TON transaction here
    tx_note: "Queued for on-chain send via Reserve Fund wallet",
    reserve_wallet: "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v",
  });
});

// GET /api/billing/history/:telegramId
router.get("/billing/history/:telegramId", (req, res) => {
  const acct = getAccount(req.params.telegramId);
  res.json({ telegramId: req.params.telegramId, history: acct.history, total: acct.history.length });
});

// GET /api/billing/stats — platform earnings overview
router.get("/billing/stats", (_req, res) => {
  let totalPaid = 0, totalCPA = 0, totalBounty = 0;
  for (const acct of billing.values()) {
    for (const h of acct.history) {
      if (h.amount > 0) totalPaid += h.amount;
      if (h.type === "cpa") totalCPA += h.amount;
      if (h.type === "bounty") totalBounty += h.amount;
    }
  }
  res.json({
    total_distributed_ton: totalPaid.toFixed(2),
    cpa_paid_ton: totalCPA.toFixed(2),
    bounty_paid_ton: totalBounty.toFixed(2),
    active_accounts: billing.size,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
