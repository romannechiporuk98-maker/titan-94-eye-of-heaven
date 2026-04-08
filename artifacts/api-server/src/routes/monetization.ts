import { Router, type IRouter } from "express";
import { subscribers } from "../services/heartbeat";
import { creditCPA } from "./billing";

const router: IRouter = Router();
const ADMIN_ID    = process.env.ADMIN_TELEGRAM_ID || "7255058720";
const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

const PLANS = [
  { id: "free",  name: "FREE",  priceTon: 0,  priceUsdt: 0,  features: ["5 scans/day", "Basic alerts", "Public API"], color: "#6b7280" },
  { id: "pro",   name: "PRO",   priceTon: 5,  priceUsdt: 19, features: ["Unlimited scans", "Gemini AI analysis", "HoneyPot detector", "Real-time alerts", "Priority support"], color: "#00FFFF" },
  { id: "elite", name: "ELITE", priceTon: 20, priceUsdt: 75, features: ["Everything in PRO", "Sniper Alert", "Copy-Trading Mirror", "Arbitrage signals", "API access", "Whale alerts", "ELITE badge"], color: "#FF8C00" },
];

router.get("/monetization/plans", (_req, res) => res.json({ plans: PLANS, reserveWallet: RESERVE_WALLET }));

router.get("/monetization/status/:telegramId", (req, res) => {
  const id  = req.params.telegramId;
  const sub = subscribers.get(id);
  if (!sub) return res.json({ telegramId: id, plan: "free", isActive: false, expiresAt: null });

  const now = Date.now();
  const active = sub.isActive && (!sub.expiresAt || new Date(sub.expiresAt).getTime() > now);
  const daysLeft = sub.expiresAt ? Math.max(0, Math.round((new Date(sub.expiresAt).getTime() - now) / 86400000)) : null;
  res.json({ telegramId: id, plan: sub.plan, isActive: active, expiresAt: sub.expiresAt, daysLeft, username: sub.username });
});

router.post("/monetization/subscribe", (req, res) => {
  const { telegram_id, plan, ton_address, username } = req.body;
  if (!telegram_id || !plan) return res.status(400).json({ error: "telegram_id and plan required" });

  const p = PLANS.find(pl => pl.id === plan);
  if (!p) return res.status(400).json({ error: "Invalid plan" });

  const expiresAt = plan === "free" ? null : new Date(Date.now() + 30 * 86400000).toISOString();
  subscribers.set(String(telegram_id), {
    telegramId: String(telegram_id), username: username || telegram_id,
    plan, tonAddress: ton_address || null, expiresAt, isActive: true,
    referredBy: null, createdAt: new Date().toISOString(),
  });

  const tonkeeperLink = plan !== "free"
    ? `https://app.tonkeeper.com/transfer/${RESERVE_WALLET}?amount=${p.priceTon * 1e9}&text=TITAN94_${plan.toUpperCase()}_${telegram_id}`
    : null;

  res.json({ success: true, plan, expiresAt, tonkeeperLink, message: `Subscribed to ${plan.toUpperCase()}` });
});

router.get("/monetization/revenue", (_req, res) => {
  const subs = [...subscribers.values()];
  const pro   = subs.filter(s => s.plan === "pro"   && s.isActive).length;
  const elite = subs.filter(s => s.plan === "elite" && s.isActive).length;
  const monthly = pro * 5 + elite * 20;
  res.json({
    subscribers: { total: subs.length, pro, elite, free: subs.filter(s => s.plan === "free").length },
    revenue: { monthly_ton: monthly, monthly_usdt: monthly * 3.84, annual_ton: monthly * 12 },
    reserveWallet: RESERVE_WALLET,
    updatedAt: new Date().toISOString(),
  });
});

// Webhook for TON payment processing
router.post("/monetization/webhook/ton-payment", (req, res) => {
  const { txHash, fromAddress, amountNano, telegramId } = req.body;
  if (!txHash || !amountNano) return res.status(400).json({ error: "txHash and amountNano required" });

  const ton = parseInt(amountNano) / 1e9;
  let plan: string | null = null;
  if (ton >= 4.5 && ton <= 5.5) plan = "pro";
  if (ton >= 19  && ton <= 21)  plan = "elite";

  if (!plan) return res.status(400).json({ error: `Amount ${ton} TON doesn't match any plan (5=PRO, 20=ELITE)` });

  const id = String(telegramId || fromAddress);
  const existing = subscribers.get(id);
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

  subscribers.set(id, {
    telegramId: id, username: existing?.username || id,
    plan, tonAddress: fromAddress, expiresAt, isActive: true,
    referredBy: existing?.referredBy || null, createdAt: existing?.createdAt || new Date().toISOString(),
  });

  // CPA: credit referrer 15%
  if (existing?.referredBy) {
    creditCPA(existing.referredBy, ton, `${id} subscribed to ${plan.toUpperCase()}`);
  }

  res.json({ success: true, plan, expiresAt, ton, txHash, message: `Activated ${plan.toUpperCase()} for ${id}` });
});

export default router;
