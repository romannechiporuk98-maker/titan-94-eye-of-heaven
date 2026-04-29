/**
 * Developer mode — purchasable tier (default 1000 TON, configurable by creator).
 * Grants API access, custom auto-earn rate, customization options.
 */
import { Router, type IRouter } from "express";
import * as creator from "../services/creator";
import * as store from "../services/store";

const router: IRouter = Router();

router.get("/developer/info", async (_req, res) => {
  const s = await creator.getSettings();
  res.json({
    plan: "developer",
    priceTon: s.developerPriceTon,
    perks: [
      `${s.developerApiQuotaPerDay} API calls/day`,
      `${s.developerPerCycle} TON per auto-earn cycle (≈ ${(s.developerPerCycle * 240).toFixed(2)} TON/day)`,
      "Custom config & branding options",
      "Direct access to TITAN-94 internal endpoints",
      "Priority HEAL & SCAN queue",
      "Lifetime ELITE perks included",
    ],
    durationDays: 30,
    reserveWallet: s.reserveAddress,
    paymentLink: (tgId: string) => `https://app.tonkeeper.com/transfer/${s.reserveAddress}?amount=${s.developerPriceTon * 1e9}&text=tg:${tgId}:developer`,
  });
});

router.get("/developer/payment-link/:tgId", async (req, res) => {
  const s = await creator.getSettings();
  const id = req.params.tgId;
  const link = `https://app.tonkeeper.com/transfer/${s.reserveAddress}?amount=${s.developerPriceTon * 1e9}&text=tg:${id}:developer`;
  res.json({
    plan: "developer",
    amount_ton: s.developerPriceTon,
    telegramId: id,
    tonkeeperLink: link,
    qrPayload: `ton://transfer/${s.reserveAddress}?amount=${s.developerPriceTon * 1e9}&text=tg:${id}:developer`,
    comment: `tg:${id}:developer`,
    reserve: s.reserveAddress,
  });
});

router.get("/developer/status/:tgId", async (req, res) => {
  const id = req.params.tgId;
  const sub = await store.getSubscriber(id);
  const isDev = sub?.plan === "developer" && sub.isActive && (!sub.expiresAt || sub.expiresAt.getTime() > Date.now());
  res.json({
    telegramId: id,
    isDeveloper: !!isDev,
    plan: sub?.plan || "free",
    expiresAt: sub?.expiresAt,
    daysLeft: sub?.expiresAt ? Math.max(0, Math.floor((sub.expiresAt.getTime() - Date.now()) / 86400000)) : 0,
  });
});

export default router;
