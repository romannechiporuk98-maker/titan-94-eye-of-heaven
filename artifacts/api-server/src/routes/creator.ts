/**
 * TITAN-94 Creator Routes — protected endpoints for the project owner.
 *
 * Auth model: a request is authorized iff:
 *   header `x-telegram-id` (or `x-creator-id`) maps to a known creator ID.
 *
 * All write endpoints invalidate caches in dependent services so changes apply live.
 */
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import * as creator from "../services/creator";
import * as store from "../services/store";

const router: IRouter = Router();

function requireCreator(req: Request, res: Response, next: NextFunction) {
  const id = String(req.headers["x-telegram-id"] || req.headers["x-creator-id"] || req.query["tg"] || "");
  if (!creator.isCreator(id)) {
    return res.status(403).json({ error: "Forbidden — creator access only", hint: "Send x-telegram-id header" });
  }
  (req as any).creatorId = id;
  next();
}

// ─── Public: check if a telegram ID is a creator ─────────────────────────
router.get("/creator/check/:tgId", (req, res) => {
  res.json({ telegramId: req.params.tgId, isCreator: creator.isCreator(req.params.tgId) });
});

// ─── Settings ───────────────────────────────────────────────────────────
router.get("/creator/settings", requireCreator, async (_req, res) => {
  const s = await creator.getSettings();
  res.json(s);
});

router.post("/creator/settings", requireCreator, async (req, res) => {
  const id = (req as any).creatorId as string;
  const next = await creator.updateSettings(req.body || {}, `creator:${id}`);
  await store.logActivity("CREATOR", "Settings updated", `${id} updated ${Object.keys(req.body || {}).length} fields`, "info", req.body);
  res.json(next);
});

router.post("/creator/settings/reset", requireCreator, async (req, res) => {
  const id = (req as any).creatorId as string;
  const next = await creator.resetSettings(`creator:${id}`);
  await store.logActivity("CREATOR", "Settings reset to defaults", `${id} reset all`, "warning");
  res.json(next);
});

// ─── Dashboard ─────────────────────────────────────────────────────────
router.get("/creator/dashboard", requireCreator, async (_req, res) => {
  const [subs, recentActivity, vulnStats, settings] = await Promise.all([
    store.listSubscribers(),
    store.listActivity(20),
    store.vulnStats(),
    creator.getSettings(),
  ]);
  const now = Date.now();
  const isActive = (s: any) => s.isActive && (!s.expiresAt || new Date(s.expiresAt).getTime() > now);
  const elite     = subs.filter((s) => isActive(s) && s.plan === "elite").length;
  const pro       = subs.filter((s) => isActive(s) && s.plan === "pro").length;
  const developer = subs.filter((s) => isActive(s) && s.plan === "developer").length;
  const free      = subs.filter((s) => isActive(s) && s.plan === "free").length;

  res.json({
    summary: {
      users: { total: subs.length, elite, pro, developer, free },
      revenue_ton: elite * settings.elitePriceTon + pro * settings.proPriceTon + developer * settings.developerPriceTon,
      cycles_active: { scan: settings.scanCycleEnabled, heal: settings.healCycleEnabled, autoEarn: settings.autoEarnEnabled, tonPoller: settings.tonPollerEnabled },
      vulnerabilities: vulnStats,
    },
    settings,
    recentActivity: recentActivity.slice(0, 20),
    creators: creator.listCreators(),
    serverTime: new Date().toISOString(),
  });
});

// ─── User management ────────────────────────────────────────────────────
router.get("/creator/users", requireCreator, async (req, res) => {
  const subs = await store.listSubscribers();
  const limit = parseInt((req.query.limit as string) || "200");
  res.json({
    total: subs.length,
    users: subs.slice(0, limit).map((s) => ({
      telegramId: s.telegramId,
      username: s.username,
      plan: s.plan,
      isActive: s.isActive,
      expiresAt: s.expiresAt,
      tonAddress: s.tonAddress,
      referredBy: s.referredBy,
      createdAt: (s as any).createdAt,
    })),
  });
});

router.get("/creator/user/:tgId", requireCreator, async (req, res) => {
  const id = req.params.tgId;
  const [sub, history, balance] = await Promise.all([
    store.getSubscriber(id),
    store.ledgerHistory(id, 50),
    store.ledgerBalance(id),
  ]);
  res.json({
    telegramId: id,
    subscriber: sub,
    balance_ton: balance,
    history,
  });
});

router.post("/creator/user/:tgId/grant", requireCreator, async (req, res) => {
  const id = req.params.tgId;
  const { plan, days, reason } = req.body || {};
  const valid = ["free", "pro", "elite", "developer"];
  if (!valid.includes(plan)) return res.status(400).json({ error: `plan must be one of ${valid.join(",")}` });
  const existing = await store.getSubscriber(id);
  const expiresAt = plan === "free" ? null : new Date(Date.now() + (parseInt(days) || 30) * 86400000);
  await store.upsertSubscriber({
    telegramId: id,
    username: existing?.username || id,
    plan,
    expiresAt,
    isActive: true,
    referredBy: existing?.referredBy ?? null,
  });
  await store.logActivity("CREATOR", `Granted ${plan.toUpperCase()} to ${id}`, reason || `manual grant by creator`, "info", { plan, days });
  res.json({ success: true, telegramId: id, plan, expiresAt });
});

router.post("/creator/user/:tgId/credit", requireCreator, async (req, res) => {
  const id = req.params.tgId;
  const { amount_ton, reason } = req.body || {};
  const amt = parseFloat(amount_ton);
  if (!isFinite(amt) || amt === 0) return res.status(400).json({ error: "amount_ton required (non-zero)" });
  await store.ledgerInsert({
    telegramId: id,
    type: "creator_grant",
    amountTon: amt,
    description: reason || `Manual credit by creator`,
  });
  await store.logActivity("CREATOR", `Credited ${amt} TON to ${id}`, reason || "manual credit", amt > 0 ? "info" : "warning");
  res.json({ success: true, telegramId: id, amount_ton: amt, balance: await store.ledgerBalance(id) });
});

// ─── Live cycles trigger ────────────────────────────────────────────────
router.post("/creator/cycle/run/:cycle", requireCreator, async (req, res) => {
  const c = req.params.cycle;
  try {
    if (c === "auto-earn") {
      const m = await import("../services/autoearn");
      const r = await m.runAutoEarn();
      return res.json({ ok: true, ran: c, result: r });
    }
    if (c === "ton-poller") {
      const m = await import("../services/ton-poller");
      const r = await m.runTonPoller();
      return res.json({ ok: true, ran: c, result: r });
    }
    return res.status(400).json({ error: `Unknown cycle: ${c}. Try auto-earn or ton-poller` });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Developer mode purchase ────────────────────────────────────────────
router.post("/creator/grant-developer/:tgId", requireCreator, async (req, res) => {
  const id = req.params.tgId;
  const { days } = req.body || {};
  const expiresAt = new Date(Date.now() + (parseInt(days) || 30) * 86400000);
  const existing = await store.getSubscriber(id);
  await store.upsertSubscriber({
    telegramId: id,
    username: existing?.username || id,
    plan: "developer",
    expiresAt,
    isActive: true,
    referredBy: existing?.referredBy ?? null,
  });
  res.json({ success: true, plan: "developer", expiresAt });
});

export default router;
