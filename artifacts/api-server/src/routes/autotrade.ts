/**
 * AUTO-TRADE API — modular self-healing trading.
 */
import { Router, type IRouter } from "express";
import * as at from "../services/autotrade";

const router: IRouter = Router();

router.get("/autotrade/meta", (_req, res) => {
  res.json({
    strategies: at.getStrategyMeta(),
    riskLevels: ["low", "medium", "high", "yolo"],
    selfHealAfterLosses: 5,
    autoResumeMinutes: 10,
    cycleIntervalSec: 180,
  });
});

router.get("/autotrade/price", async (_req, res) => {
  const snap = await at.fetchPriceSnapshot();
  res.json(snap);
});

router.get("/autotrade/stats", async (_req, res) => {
  res.json(await at.getEngineStats());
});

router.get("/autotrade/positions", async (req, res) => {
  const owner = req.query.owner ? String(req.query.owner) : undefined;
  const list = await at.listPositionsForOwner(owner);
  res.json({ total: list.length, positions: list });
});

router.post("/autotrade/open", async (req, res) => {
  const { ownerTgId, strategy, risk, depositTon } = req.body || {};
  if (!ownerTgId)            return res.status(400).json({ error: "ownerTgId required" });
  if (!strategy || !risk)    return res.status(400).json({ error: "strategy + risk required" });
  if (!depositTon || depositTon <= 0) return res.status(400).json({ error: "depositTon must be > 0" });
  if (depositTon > 10000)    return res.status(400).json({ error: "Max deposit per position: 10000 TON" });
  const pos = await at.openPosition({ ownerTgId, strategy, risk, depositTon: Number(depositTon) });
  res.json(pos);
});

router.post("/autotrade/:id/close", async (req, res) => {
  const r = await at.closePosition(req.params.id);
  res.json(r);
});

router.post("/autotrade/:id/pause", async (req, res) => {
  const { paused, reason } = req.body || {};
  const pos = await at.pausePosition(req.params.id, !!paused, reason);
  if (!pos) return res.status(404).json({ error: "Not found" });
  res.json(pos);
});

router.post("/autotrade/run-cycle", async (_req, res) => {
  const r = await at.runAutoTradeCycle();
  res.json(r);
});

export default router;
