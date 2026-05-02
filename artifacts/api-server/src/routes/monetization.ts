import { Router, type IRouter, type Request, type Response } from "express";
import * as store from "../services/store";
import * as creator from "../services/creator";
import { creditCPA } from "./billing";

const router: IRouter = Router();
const RESERVE_WALLET = store.RESERVE;

const PLANS = [
  { id: "free",  name: "FREE",  priceTon: 0,  priceUsdt: 0,  features: ["5 scans/day", "Basic alerts", "Public API"], color: "#6b7280" },
  { id: "pro",   name: "PRO",   priceTon: 5,  priceUsdt: 19, features: ["Unlimited scans", "Gemini AI analysis", "HoneyPot detector", "Real-time alerts", "Priority support"], color: "#00FFFF" },
  { id: "elite", name: "ELITE", priceTon: 20, priceUsdt: 75, features: ["Everything in PRO", "Sniper Alert", "Copy-Trading Mirror", "Arbitrage signals", "API access", "Whale alerts", "ELITE badge"], color: "#FF8C00" },
];

router.get("/monetization/plans", (_req, res) => res.json({ plans: PLANS, reserveWallet: RESERVE_WALLET }));

router.get("/monetization/status/:telegramId", async (req: Request, res: Response) => {
  const id  = req.params.telegramId;
  const sub = await store.getSubscriber(id);
  if (!sub) return res.json({ telegramId: id, plan: "free", isActive: false, expiresAt: null });

  const now = Date.now();
  const active   = sub.isActive && (!sub.expiresAt || sub.expiresAt.getTime() > now);
  const daysLeft = sub.expiresAt ? Math.max(0, Math.round((sub.expiresAt.getTime() - now) / 86400000)) : null;
  res.json({ telegramId: id, plan: sub.plan, isActive: active, expiresAt: sub.expiresAt, daysLeft, username: sub.username });
});

/**
 * POST /api/monetization/subscribe
 *
 * Security model:
 *  - FREE plan: open (no auth required — just registration)
 *  - PRO / ELITE / DEVELOPER: requires a verified Telegram initData HMAC
 *    OR the request must originate from the TON-POLLER internal webhook
 *    (identified by x-internal-key header).
 *
 * This prevents anyone from spoofing a telegram_id and self-granting a paid plan.
 */
router.post("/monetization/subscribe", async (req: Request, res: Response) => {
  const { telegram_id, plan, ton_address, username, stars_payment } = req.body || {};
  if (!telegram_id || !plan) return res.status(400).json({ error: "telegram_id and plan required" });

  const p = PLANS.find((pl) => pl.id === plan);
  if (!p) return res.status(400).json({ error: "Invalid plan" });

  const isPaidPlan = plan !== "free";

  if (isPaidPlan) {
    const tgUser = (req as any).tgUser;

    // Internal webhook key — must be set AND must match (prevents undefined===undefined bypass)
    const internalKeyHeader = String(req.headers["x-internal-key"] || "");
    const configuredKey     = process.env["INTERNAL_WEBHOOK_KEY"] || "";
    const validInternalKey  = configuredKey.length > 0 && internalKeyHeader === configuredKey;

    // Verified Telegram WebApp initData (HMAC-validated, user.id matches claimed telegram_id)
    const isVerifiedTgUser  = tgUser?.verified === true && String(tgUser.id) === String(telegram_id);

    // Creator override (creator can grant plans from the panel)
    const isCreatorReq      = tgUser?.verified === true && creator.isCreator(String(tgUser.id));

    // stars_payment flag in body is NOT a valid bypass — it's only set by the internal bot call
    // which also carries the x-internal-key header; standalone body flag is ignored here.

    if (!isVerifiedTgUser && !validInternalKey && !isCreatorReq) {
      return res.status(403).json({
        error: "Paid plan activation requires verified Telegram initData (HMAC). " +
               "Send x-tg-init-data header from Telegram.WebApp.initData.",
        hint: "Use TON Connect or Telegram Stars to subscribe.",
        payment_required: true,
        amount_ton: p.priceTon,
        payment_comment: `TITAN94_${telegram_id}_${plan}`,
      });
    }
  }

  const expiresAt = plan === "free" ? null : new Date(Date.now() + 30 * 86400000);
  const existing  = await store.getSubscriber(String(telegram_id));

  await store.upsertSubscriber({
    telegramId: String(telegram_id),
    username:   username || existing?.username || String(telegram_id),
    plan,
    tonAddress: ton_address || existing?.tonAddress || null,
    expiresAt,
    isActive: true,
    referredBy: existing?.referredBy ?? null,
  });

  if (isPaidPlan && existing?.referredBy) {
    await creditCPA(existing.referredBy, p.priceTon, `${telegram_id} subscribed to ${plan.toUpperCase()} (stars/verified)`, "stars");
  }

  await store.logActivity(
    "FINANCE", `${plan.toUpperCase()} activated`,
    `${telegram_id} — ${stars_payment ? "Stars payment" : "verified subscribe"}`,
    "success",
    { telegramId: telegram_id, plan, stars_payment: !!stars_payment },
  );

  const tonkeeperLink = isPaidPlan
    ? `https://app.tonkeeper.com/transfer/${RESERVE_WALLET}?amount=${p.priceTon * 1e9}&text=TITAN94_${telegram_id}_${plan}`
    : null;

  res.json({ success: true, plan, expiresAt, tonkeeperLink, message: `Subscribed to ${plan.toUpperCase()}` });
});

router.get("/monetization/revenue", async (_req: Request, res: Response) => {
  const subs = await store.listSubscribers();
  const now = Date.now();
  const isActive = (s: typeof subs[number]) => s.isActive && (!s.expiresAt || s.expiresAt.getTime() > now);
  const pro   = subs.filter((s) => isActive(s) && s.plan === "pro").length;
  const elite = subs.filter((s) => isActive(s) && s.plan === "elite").length;
  const free  = subs.filter((s) => s.plan === "free").length;
  const monthly = pro * 5 + elite * 20;
  res.json({
    subscribers: { total: subs.length, pro, elite, free },
    revenue: { monthly_ton: monthly, monthly_usdt: monthly * 3.84, annual_ton: monthly * 12 },
    reserveWallet: RESERVE_WALLET,
    updatedAt: new Date().toISOString(),
  });
});

router.get("/monetization/subscribers", async (_req: Request, res: Response) => {
  const subs = await store.listSubscribers();
  res.json({
    total: subs.length,
    subscribers: subs.map((s) => ({
      telegramId: s.telegramId, username: s.username, plan: s.plan,
      isActive: s.isActive, expiresAt: s.expiresAt,
      tonAddress: s.tonAddress ? s.tonAddress.slice(0, 12) + "..." : null,
    })),
  });
});

// Webhook for TON payment processing — stores payment + activates plan
router.post("/monetization/webhook/ton-payment", async (req: Request, res: Response) => {
  const { txHash, fromAddress, amountNano, telegramId, comment } = req.body || {};
  if (!txHash || !amountNano) return res.status(400).json({ error: "txHash and amountNano required" });

  const ton = parseInt(amountNano) / 1e9;

  // Determine plan — prefer on-chain comment (TITAN94_<tgId>_<plan>) over amount range
  let plan: "pro" | "elite" | "developer" | null = null;
  let resolvedTgId: string | null = null;

  const commentStr = String(comment || "");
  const titanMatch = commentStr.match(/^TITAN94[_:]([^_:]+)[_:](\w+)$/i) ||
                     commentStr.match(/^tg[_:]([^_:]+)[_:](\w+)$/i);
  if (titanMatch) {
    resolvedTgId = titanMatch[1];
    const planName = titanMatch[2].toLowerCase();
    if (["pro", "elite", "developer"].includes(planName)) {
      plan = planName as "pro" | "elite" | "developer";
    }
  }

  // Fallback: match by amount only
  if (!plan) {
    if (ton >= 4.5 && ton <= 5.5)   plan = "pro";
    if (ton >= 19  && ton <= 21)    plan = "elite";
    if (ton >= 990 && ton <= 1010)  plan = "developer";
  }

  if (!plan) {
    await store.recordTonPayment({
      txHash, fromAddress: fromAddress ?? "unknown", toAddress: RESERVE_WALLET,
      amountNano: String(amountNano), comment: commentStr, verified: false,
    });
    return res.status(400).json({ error: `Amount ${ton} TON doesn't match any plan (5=PRO, 20=ELITE, 1000=DEV)` });
  }

  const id = String(resolvedTgId || telegramId || fromAddress);
  const existing  = await store.getSubscriber(id);
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  await store.upsertSubscriber({
    telegramId: id, username: existing?.username || id,
    plan, tonAddress: fromAddress, expiresAt, isActive: true,
    referredBy: existing?.referredBy ?? null,
  });

  await store.recordTonPayment({
    txHash, fromAddress: fromAddress ?? "unknown", toAddress: RESERVE_WALLET,
    amountNano: String(amountNano), comment: commentStr, telegramId: id,
    planActivated: plan, verified: true,
  });

  await store.ledgerInsert({
    telegramId: id, type: "subscription", amountTon: ton,
    description: `${plan.toUpperCase()} subscription`, txHash,
  });

  if (existing?.referredBy) {
    await creditCPA(existing.referredBy, ton, `${id} → ${plan.toUpperCase()}`, txHash);
  }

  await store.logActivity(
    "FINANCE", `${plan.toUpperCase()} activated`,
    `${id} paid ${ton} TON · tx ${txHash.slice(0, 10)}... · comment: ${commentStr.slice(0, 30)}`,
    "success",
  );

  const settingsForCreator = await creator.getSettings();
  void settingsForCreator;

  res.json({ success: true, plan, expiresAt, ton, txHash, message: `Activated ${plan.toUpperCase()} for ${id}` });
});

export default router;
